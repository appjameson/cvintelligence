// No seu arquivo de configuração do banco (ex: server/storage.ts)

import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// ---- INÍCIO DA SOLUÇÃO COM CONEXÃO DIRETA ----

// 1. Defina sua string de conexão completa diretamente aqui.
// Substitua com os seus dados reais.
const MINHA_STRING_DE_CONEXAO =
  "postgresql://cvintelligence:cvintelligence*2025@129.148.23.233:54321/cvintelligence";

// Verifique se a string foi preenchida para evitar erros.
if (MINHA_STRING_DE_CONEXAO.includes("SEU_USUARIO")) {
  throw new Error(
    "Por favor, substitua os dados de exemplo na string de conexão direta.",
  );
}

// ---- FIM DA SOLUÇÃO ----

console.log("INFO: Usando string de conexão definida diretamente no código.");

// 2. Use a constante que você criou para configurar o Pool.
export const pool = new Pool({
  connectionString: MINHA_STRING_DE_CONEXAO, // <-- USANDO A CONSTANTE DIRETA
  ssl: false, // Mantenha como 'false' para conexões locais sem SSL
});

export const db = drizzle(pool, { schema });
