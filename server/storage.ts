import {
  users,
  cvAnalyses,
  type User,
  type UpsertUser,
  type InsertCvAnalysis,
  type CvAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(id: string, credits: number): Promise<User>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  
  // CV Analysis operations
  createCvAnalysis(analysis: InsertCvAnalysis): Promise<CvAnalysis>;
  getUserCvAnalyses(userId: string): Promise<CvAnalysis[]>;
  getCvAnalysis(id: number): Promise<CvAnalysis | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserCredits(id: string, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId, 
        stripeSubscriptionId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // CV Analysis operations
  async createCvAnalysis(analysis: InsertCvAnalysis): Promise<CvAnalysis> {
    const [result] = await db
      .insert(cvAnalyses)
      .values(analysis)
      .returning();
    return result;
  }

  async getUserCvAnalyses(userId: string): Promise<CvAnalysis[]> {
    return await db
      .select()
      .from(cvAnalyses)
      .where(eq(cvAnalyses.userId, userId))
      .orderBy(desc(cvAnalyses.createdAt));
  }

  async getCvAnalysis(id: number): Promise<CvAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(cvAnalyses)
      .where(eq(cvAnalyses.id, id));
    return analysis;
  }
}

export const storage = new DatabaseStorage();
