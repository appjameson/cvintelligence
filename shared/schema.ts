import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  serial,
  type AnyPgColumn
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appSettings = pgTable("app_settings", {
  key: varchar("key").primaryKey(), // Ex: "GEMINI_API_KEY"
  value: text("value").notNull(),   // O valor da chave
});

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const creditPurchases = pgTable("credit_purchases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  packageName: varchar("package_name").notNull(), // 'básico', 'premium', 'profissional'
  creditsPurchased: integer("credits_purchased").notNull(),
  amountPaid: integer("amount_paid").notNull(), // Em centavos
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // For local authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  credits: integer("credits").default(2).notNull(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  authProvider: varchar("auth_provider").default("local").notNull(), // 'local' or 'google'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cvAnalyses = pgTable("cv_analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  previousAnalysisId: integer("previous_analysis_id").references((): AnyPgColumn => cvAnalyses.id),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  analysisResult: jsonb("analysis_result").notNull(),
  score: integer("score").notNull(),
  suggestions: jsonb("suggestions").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const registerUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
}).extend({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
});

export const insertCvAnalysisSchema = createInsertSchema(cvAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertCreditPurchaseSchema = createInsertSchema(creditPurchases);
export type InsertCreditPurchase = z.infer<typeof insertCreditPurchaseSchema>;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertCvAnalysis = z.infer<typeof insertCvAnalysisSchema>;
export type CvAnalysis = typeof cvAnalyses.$inferSelect;
export const analysisResultSchema = z.object({
  weaknesses: z.array(z.string()).optional(),
  suggestions: z.array(z.any()).optional(),
  // Adicione outras propriedades de analysisResult que você usa, se necessário
});