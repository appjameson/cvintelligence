import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Configure PostgreSQL connection for external database
const connectionString = `postgresql://cvanalyzer:cvanalyzer*2025@129.148.23.233:54321/cvanalyzer`;

export const pool = new Pool({ 
  connectionString,
  ssl: false // Disable SSL for direct IP connection
});

export const db = drizzle(pool, { schema });