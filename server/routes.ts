import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeCv } from "./services/openai";
import { registerUserSchema, loginUserSchema, type InsertUser, type LoginUser } from "@shared/schema";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import Stripe from "stripe";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { db } from './db';
import { sql } from "drizzle-orm";
import { sendEmail } from './services/email'
import { DEFAULT_CV_ANALYSIS_PROMPT } from './services/openai';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not set. Payment functionality will be disabled.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use PDF, DOC ou DOCX.'));
    }
  }
});

// Setup session middleware for local auth
function setupLocalAuth(app: Express) {
  try {
    const PostgresSessionStore = connectPg(session);
    const sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: "sessions"
    });

    app.use(session({
      secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    }));
  } catch (error) {
    console.error("Session setup error:", error);
    // Fallback to memory store if PostgreSQL session store fails
    app.use(session({
      secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }));
  }
}

// Custom authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

async function requireAdmin(req: any, res: any, next: any) {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(userId);
  if (user && user.isAdmin) {
    // Se o usuário existe e é admin, pode prosseguir
    return next();
  }

  // Se não for admin, retorna erro de "Acesso Proibido"
  return res.status(403).json({ message: "Forbidden: Acesso restrito a administradores." });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup local authentication
  setupLocalAuth(app);

  // Initialize admin user
  await storage.initializeAdminUser();

  app.get('/api/admin/settings', requireAuth, requireAdmin, async (req, res) => {
    try {
      // Busca as configurações do banco
      let geminiKey = await storage.getSetting('GEMINI_API_KEY');
      let stripeKey = await storage.getSetting('STRIPE_SECRET_KEY');
      let geminiPrompt = await storage.getSetting('GEMINI_PROMPT_CV_ANALYSIS');
      let geminiModel = await storage.getSetting('GEMINI_MODEL_NAME');

      // Se não houver um prompt salvo no banco, usamos o padrão do código
      if (!geminiPrompt) {
        geminiPrompt = DEFAULT_CV_ANALYSIS_PROMPT;
      }

      res.json({
        GEMINI_API_KEY: geminiKey,
        STRIPE_SECRET_KEY: stripeKey,
        GEMINI_PROMPT_CV_ANALYSIS: geminiPrompt,
        GEMINI_MODEL_NAME: geminiModel,
      });
    } catch (error) { // <-- O bloco CATCH que estava faltando ou no lugar errado
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: 'Erro ao buscar configurações.' });
    }
  });

  app.post('/api/admin/settings', requireAuth, requireAdmin, async (req, res) => {
    try {
      // A desestruturação continua a mesma
      const { geminiKey, stripeKey, geminiPrompt, geminiModel } = req.body;

      if ('geminiKey' in req.body) {
        // O await aqui garante que esperamos a operação terminar antes de continuar
        await storage.updateSetting('GEMINI_API_KEY', geminiKey);
      }
      if ('stripeKey' in req.body) {
        await storage.updateSetting('STRIPE_SECRET_KEY', stripeKey);
      }
      if ('geminiPrompt' in req.body) {
        await storage.updateSetting('GEMINI_PROMPT_CV_ANALYSIS', geminiPrompt);
      }
      if ('geminiModel' in req.body) {
        await storage.updateSetting('GEMINI_MODEL_NAME', geminiModel);
      }

      for (const key in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          await storage.updateSetting(key, req.body[key]);
        }
      }
      res.status(200).json({ message: 'Configurações salvas com sucesso!' });
      
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ message: 'Erro ao salvar configurações.' });
    }
  });

  // Manual auth routes
  app.post('/api/register', async (req, res) => {
    try {
      const allowSignups = await storage.getSetting('ALLOW_NEW_REGISTRATIONS');
      if (allowSignups === 'false') {
        return res.status(403).json({ message: 'Novos cadastros estão temporariamente desabilitados pela administração.' });
      }

      const userData = registerUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe com este email" });
      }
      const user = await storage.createUser(userData);
      (req.session as any).userId = user.id;

      const requireConfirmation = await storage.getSetting('REQUIRE_EMAIL_CONFIRMATION');
      if (requireConfirmation === 'true') {
        await sendEmail({
          to: user.email,
          subject: 'Bem-vindo ao CVIntelligence - Confirme seu E-mail',
          html: `<h1>Bem-vindo, ${user.firstName}!</h1><p>Obrigado por se cadastrar. Por favor, clique no link para confirmar seu e-mail.</p>`
        });
      }
      
      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits,
        isAdmin: user.isAdmin
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro no cadastro" 
      });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const credentials = loginUserSchema.parse(req.body);
      const user = await storage.loginUser(credentials);
      
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Set session
      (req.session as any).userId = user.id;
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro no login" 
      });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Get current user
  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  // CV Analysis routes
  app.post('/api/upload-cv', requireAuth, upload.single('cv'), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (user.credits <= 0) {
        return res.status(402).json({ 
          message: "Créditos insuficientes. Adquira mais créditos para continuar.",
          needsPayment: true 
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Read file content
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'base64');
      
      // Analyze CV with OpenAI
      const analysis = await analyzeCv(fileContent, req.file.originalname, req.body.targetRole);

      if (!analysis.isResume) {
        // Limpa o arquivo enviado
        fs.unlinkSync(filePath);
        // Retorna um erro para o usuário
        return res.status(400).json({ message: "O arquivo enviado não parece ser um currículo." });
      }
      
      // Save analysis to database
      const cvAnalysis = await storage.createCvAnalysis({
        userId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        analysisResult: analysis,
        score: analysis.score,
        suggestions: analysis.suggestions,
      });

      // Update user credits
      await storage.updateUserCredits(userId, user.credits - 1);

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        analysisId: cvAnalysis.id,
        analysis,
        creditsRemaining: user.credits - 1
      });

    } catch (error) {
      console.error("Error analyzing CV:", error);
      
      // Clean up file if it exists
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao analisar currículo" 
      });
    }
  });

  app.get('/api/analyses', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const analyses = await storage.getUserCvAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Erro ao buscar análises" });
    }
  });

  app.get('/api/analyses/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const analysisId = parseInt(req.params.id);
      
      const analysis = await storage.getCvAnalysis(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ message: "Análise não encontrada" });
      }

      if (analysis.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Erro ao buscar análise" });
    }
  });

  // Payment routes
  if (stripe) {
    app.post("/api/create-payment-intent", requireAuth, async (req: any, res) => {
      try {
        const { credits } = req.body;
        const amount = credits * 5; // R$ 5 per credit
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "brl",
          metadata: {
            userId: req.session.userId,
            credits: credits.toString()
          }
        });
        
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        res.status(500).json({ 
          message: "Erro ao criar intenção de pagamento: " + error.message 
        });
      }
    });

    app.post('/api/webhook', async (req, res) => {
      const sig = req.headers['stripe-signature'];
      
      try {
        const event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
        
        if (event.type === 'payment_intent.succeeded') {
          const paymentIntent = event.data.object;
          const userId = paymentIntent.metadata.userId;
          const credits = parseInt(paymentIntent.metadata.credits);
          const packageName = paymentIntent.metadata.packageName; // Precisaremos adicionar isso
          
          const user = await storage.getUser(userId);
          if (user) {
            // A lógica de atualizar os créditos do usuário continua
            await storage.updateUserCredits(userId, user.credits + credits);
            
            // ADICIONE A LÓGICA PARA REGISTRAR A COMPRA
            await storage.logCreditPurchase({
              userId,
              packageName: packageName || 'desconhecido',
              creditsPurchased: credits,
              amountPaid: paymentIntent.amount,
              stripePaymentIntentId: paymentIntent.id,
            });
          }
        }
        res.json({ received: true });
      } catch (err: any) {
        console.error('Webhook error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
      }
    });
  }

  app.get('/api/admin/user-stats', requireAuth, requireAdmin, async (req, res) => {
    const period = req.query.period as 'day' | 'week' | 'month' || 'day';
    try {
      const stats = await storage.getComparativeUserStats(period);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar estatísticas de usuários.' });
    }
  });

  app.get('/api/admin/db-status', requireAuth, requireAdmin, async (req, res) => {
    try {
      // Tenta executar a consulta mais simples possível no banco
      await db.execute(sql`SELECT 1`);
      res.json({ status: 'ok', message: 'Conexão com o banco de dados bem-sucedida.' });
    } catch (error) {
      console.error("Database connection check failed:", error);
      res.status(500).json({ status: 'error', message: 'Não foi possível conectar ao banco de dados.' });
    }
  });

  // Rota de exemplo para administradores
  app.get('/api/admin/dashboard-data', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Busca todos os dados reais do banco de dados
    const totalUsers = await storage.getTotalUsers();
    const analysesToday = await storage.getAnalysesCountToday();
    const averageScore = await storage.getAverageScore();
    const newUsersToday = await storage.getNewUsersCountToday();
    const packageCounts = await storage.getPackagePurchaseCounts();

    res.json({
      message: "Dados do dashboard carregados com sucesso!",
      totalUsers,
      analysesToday,
      averageScore,
      packageCounts,
      newUsersToday
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    res.status(500).json({ message: 'Erro ao buscar dados do dashboard.' });
  }
});

  const httpServer = createServer(app);
  return httpServer;
}
