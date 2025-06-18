import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeCv } from "./services/openai";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import Stripe from "stripe";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  // CV Analysis routes
  app.post('/api/upload-cv', isAuthenticated, upload.single('cv'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/analyses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyses = await storage.getUserCvAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Erro ao buscar análises" });
    }
  });

  app.get('/api/analyses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
    app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
      try {
        const { credits } = req.body;
        const amount = credits * 5; // R$ 5 per credit
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "brl",
          metadata: {
            userId: req.user.claims.sub,
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
