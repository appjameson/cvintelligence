import {
  users,
  cvAnalyses,
  sessions,
  appSettings,
  creditPurchases,
  type User,
  type UpsertUser,
  type InsertUser,
  type LoginUser,
  type InsertCvAnalysis,
  type CvAnalysis,
  type InsertCreditPurchase // Agora este import vai funcionar
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, count, avg, sql } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { nanoid } from "nanoid";


type UserStats = { date: string; count: number };

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

  logCreditPurchase(data: InsertCreditPurchase): Promise<void>;
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

  async logCreditPurchase(data: InsertCreditPurchase): Promise<void> {
    await db.insert(creditPurchases).values(data);
  }

  async getPackagePurchaseCounts(): Promise<{ name: string; count: number }[]> {
    const result = await db
      .select({
        name: creditPurchases.packageName,
        count: sql<number>`count(*)::int`,
      })
      .from(creditPurchases)
      .groupBy(creditPurchases.packageName);
    return result;
  }


  async getComparativeUserStats(period: 'day' | 'week' | 'month'): Promise<any[]> {
    let interval = '1 day';
    let format = 'DD/MM';
    let periodsToCompare = 7; // Compara os últimos 7 dias por padrão

    if (period === 'week') {
      interval = '1 week';
      format = 'W'; // Número da semana
      periodsToCompare = 8; // 8 semanas
    } else if (period === 'month') {
      interval = '1 month';
      format = 'Mon'; // Nome do mês abreviado
      periodsToCompare = 12; // 12 meses
    }

    const query = sql`
      WITH periods AS (
        SELECT generate_series(
          DATE_TRUNC(${period}, NOW() - INTERVAL '${sql.raw(`${periodsToCompare - 1} ${period}`)}'),
          DATE_TRUNC(${period}, NOW()),
          INTERVAL '1 ${sql.raw(period)}'
        ) AS period_start
      )
      SELECT
        TO_CHAR(p.period_start, ${format}) AS date,
        (SELECT count(*) FROM users WHERE DATE_TRUNC(${period}, "created_at") = p.period_start) AS current
      FROM periods p
      ORDER BY p.period_start;
    `;

    const result = await db.execute(query);
    return result.rows;
  }


  async getAverageScore(): Promise<number> {
    const [result] = await db.select({ value: avg(cvAnalyses.score) }).from(cvAnalyses);
    // O avg pode retornar null se não houver análises, então tratamos isso.
    // O toFixed(0) arredonda para o inteiro mais próximo.
    return result.value ? parseFloat(parseFloat(result.value).toFixed(0)) : 0;
  }

  async getNewUsersCountToday(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(users).where(
      // Compara se a data de criação é hoje
      sql`date("created_at") = CURRENT_DATE`
    );
    return result.value;
  }

  async getTotalUsers(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(users);
    return result.value;
  }

  async getAnalysesCountToday(): Promise<number> {
    // Esta função é mais complexa e precisaria de uma cláusula WHERE para a data.
    // Por simplicidade, vamos contar todas as análises por enquanto.
    const [result] = await db.select({ value: count() }).from(cvAnalyses);
    return result.value;
  }

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting?.value ?? null;
  }

  async updateSetting(key: string, value: string): Promise<void> {
    await db.insert(appSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value },
      });
  }
  
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
