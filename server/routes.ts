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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup local authentication
  setupLocalAuth(app);

  // Initialize admin user
  await storage.initializeAdminUser();

  // Manual auth routes
  app.post('/api/register', async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe com este email" });
      }

      const user = await storage.createUser(userData);
      
      // Set session
      (req.session as any).userId = user.id;
      
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
      const analysis = await analyzeCv(fileContent, req.file.originalname);
      
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
          
          const user = await storage.getUser(userId);
          if (user) {
            await storage.updateUserCredits(userId, user.credits + credits);
          }
        }
        
        res.json({ received: true });
      } catch (err: any) {
        console.error('Webhook error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
