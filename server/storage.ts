import {
  users,
  cvAnalyses,
  type User,
  type UpsertUser,
  type InsertUser,
  type LoginUser,
  type InsertCvAnalysis,
  type CvAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { nanoid } from "nanoid";

const scryptAsync = promisify(scrypt);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  loginUser(credentials: LoginUser): Promise<User | null>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(id: string, credits: number): Promise<User>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  
  // CV Analysis operations
  createCvAnalysis(analysis: InsertCvAnalysis): Promise<CvAnalysis>;
  getUserCvAnalyses(userId: string): Promise<CvAnalysis[]>;
  getCvAnalysis(id: number): Promise<CvAnalysis | undefined>;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(userData.password);
    const userId = nanoid();
    
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        authProvider: 'local',
        credits: 2, // Default credits for new users
      })
      .returning();
    return user;
  }

  async loginUser(credentials: LoginUser): Promise<User | null> {
    const user = await this.getUserByEmail(credentials.email);
    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await comparePasswords(credentials.password, user.password);
    if (!isValidPassword) {
      return null;
    }

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

  // Initialize admin user
  async initializeAdminUser(): Promise<void> {
    const existingAdmin = await this.getUserByEmail('jamesonabade@gmail.com');
    if (!existingAdmin) {
      const hashedPassword = await hashPassword('admin123');
      await db.insert(users).values({
        id: 'admin-jameson',
        email: 'jamesonabade@gmail.com',
        password: hashedPassword,
        firstName: 'Jameson',
        lastName: 'Abade dos Santos',
        authProvider: 'local',
        credits: 100,
        isAdmin: true,
      });
      console.log('Admin user created: jamesonabade@gmail.com');
    }
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
