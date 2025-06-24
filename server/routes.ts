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

  app.post('/api/admin/test-email', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    // 1. Pega o ID do usuário da sessão, que já foi validada pelos middlewares
    const userId = req.session.userId;
    const user = await storage.getUser(userId);

    // 2. Garante que o usuário e o e-mail dele foram encontrados
    if (!user || !user.email) {
      return res.status(404).json({ message: "Usuário administrador logado ou e-mail não encontrado." });
    }

    // 3. Usa o e-mail do próprio usuário logado como destinatário
    await sendEmail({
      to: user.email,
      subject: '✅ Teste de Configuração de E-mail - CVIntelligence',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Olá, ${user.firstName}!</h2>
          <p>Se você recebeu este e-mail, suas configurações de SMTP no painel de admin do CVIntelligence estão funcionando perfeitamente.</p>
        </div>
      `,
    });

    res.status(200).json({ message: `E-mail de teste enviado com sucesso para ${user.email}!` });

  } catch (error) {
    console.error("Test email failed:", error);
    res.status(500).json({ message: 'Falha ao enviar e-mail de teste.', error: error instanceof Error ? error.message : String(error) });
  }
});
  // Setup local authentication
  setupLocalAuth(app);

  // Initialize admin user
  await storage.initializeAdminUser();

  app.get('/api/admin/settings', requireAuth, requireAdmin, async (req, res) => {
    try {
      // 1. Define a lista de TODAS as chaves de configuração que queremos buscar.
      const settingsKeys = [
        'GEMINI_API_KEY', 
        'STRIPE_SECRET_KEY', 
        'GEMINI_PROMPT_CV_ANALYSIS', 
        'GEMINI_MODEL_NAME',
        'AI_TEMPERATURE',
        'GOOGLE_CLIENT_ID', 
        'GOOGLE_CLIENT_SECRET', 
        'EMAIL_SMTP_HOST', 
        'EMAIL_SMTP_PORT',
        'EMAIL_SMTP_USER', 
        'EMAIL_SMTP_PASSWORD',
        'EMAIL_FROM_ADDRESS', 
        'ALLOW_NEW_REGISTRATIONS', 
        'REQUIRE_EMAIL_CONFIRMATION'
      ];

      // 2. Busca todas as configurações do banco de uma só vez.
      const settingsPromises = settingsKeys.map(key => storage.getSetting(key));
      const settingsValues = await Promise.all(settingsPromises);
      
      // 3. Monta o objeto de resposta final.
      const settings = settingsKeys.reduce((obj, key, index) => {
        // A chave no objeto será a mesma do array (ex: 'EMAIL_SMTP_HOST')
        // O valor será o que veio do banco de dados.
        obj[key] = settingsValues[index];
        return obj;
      }, {} as Record<string, string | null>);

      // 4. Envia o objeto JSON completo para o frontend.
      res.json(settings);

    } catch (error) {
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
  // A variável 'filePath' é declarada aqui para ser acessível no 'finally'
  let filePath: string | undefined = req.file?.path;

  try {
    // --- CORREÇÃO: DECLARAR 'userId' E 'user' PRIMEIRO ---
    const userId = req.session.userId;
    if (!userId) {
      // Esta verificação é uma segurança extra
      return res.status(401).json({ message: "Sessão inválida ou não encontrada." });
    }
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (user.credits <= 0) {
      return res.status(402).json({ message: "Créditos insuficientes." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }
    
    // Agora que temos o filePath definitivo, o usamos.
    filePath = req.file.path;

    if (!filePath) {
      // Isso garante para o TypeScript que filePath não é undefined daqui para frente
      return res.status(500).json({ message: "Não foi possível encontrar o caminho do arquivo salvo." });
    }
    
    const latestAnalysis = await storage.getLatestUserAnalysis(userId);

    const analysis = await analyzeCv(
      filePath, 
      req.file.mimetype,
      req.file.originalname, 
      req.body.targetRole,
      latestAnalysis
    );
    
    const cvAnalysis = await storage.createCvAnalysis({
      userId,
      previousAnalysisId: latestAnalysis?.id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      analysisResult: analysis,
      score: analysis.score ?? 0,
      suggestions: analysis.suggestions ?? [],
    });

    const updatedUser = await storage.updateUserCredits(userId, user.credits - 1);

    // Limpa o arquivo local APENAS se tudo deu certo
    if (filePath) fs.unlinkSync(filePath);
    filePath = undefined; // Marca como indefinido para não ser deletado de novo no 'finally'

    res.json({
      analysisId: cvAnalysis.id,
      analysis,
      creditsRemaining: updatedUser.credits
    });

  } catch (error) {
    console.error("Error in /api/upload-cv route:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Erro ao analisar currículo" });
  } finally {
    // Garante que o arquivo local seja deletado em caso de erro
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
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
