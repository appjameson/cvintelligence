import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "../storage";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

interface CvAnalysisResult {
  isResume: boolean;
  score: number;
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: {
    category: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  keywordOptimization: {
    missing: string[];
    present: string[];
  };
  actionableExamples: {
    before: string;
    after: string;
    explanation: string;
  }[];
  formatFeedback: {
    rating: number;
    comments: string[];
  };
  scoreDetails: {
    clarity: number;
    experienceImpact: number;
    relevance: number;
    skills: number;
    formatting: number;
  };
}

export const DEFAULT_CV_ANALYSIS_PROMPT = `
    **PERSONA:** Você é um Recrutador Sênior e Especialista em Carreiras, com vasta experiência em avaliar currículos para diversos setores do mercado de trabalho no Brasil. Sua tarefa é analisar o currículo a seguir com um olhar crítico, imparcial e construtivo.

    **TAREFA:** Analise o documento e forneça um feedback estruturado, estritamente no formato JSON.

    **ETAPA 1: Validação do Conteúdo**
    Primeiro, valide se o texto fornecido parece ser um currículo profissional. Se for claramente outro tipo de documento (uma nota fiscal, um artigo, uma receita, etc.), retorne imediatamente com "isResume": false e os outros campos vazios ou com valores padrão.

    **ETAPA 2: Análise e Pontuação (SOMENTE se for um currículo)**
    Se "isResume" for true, avalie o currículo com base na rubrica abaixo. A pontuação final é a soma dos pontos de cada critério.

    **Rubrica de Pontuação (Total Máximo: 100 pontos):**
    - Clareza e Objetividade (Máx 15 pts)
    - Impacto e Resultados na Experiência (Máx 30 pts)
    - Relevância para a Vaga (Máx 25 pts)
    - Habilidades e Competências (Máx 15 pts)
    - Formatação e Profissionalismo (Máx 15 pts)

    **ETAPA 3: Geração da Resposta JSON**
    Retorne APENAS o objeto JSON abaixo.

    {
      "isResume": boolean,
      "score": number (0-100, se não for currículo, retorne 0),
      "scoreDetails": {
        "clarity": number,       // Pontos para Clareza e Objetividade (0-15)
        "experienceImpact": number, // Pontos para Impacto e Resultados (0-30)
        "relevance": number,     // Pontos para Relevância para a Vaga (0-25)
        "skills": number,        // Pontos para Habilidades e Competências (0-15)
        "formatting": number     // Pontos para Formatação e Profissionalismo (0-15)
      },
      "overallFeedback": "string",
      "strengths": ["array de strings"],
      "weaknesses": ["array de strings"],
      "suggestions": [
        {
          "category": "string",
          "recommendation": "string",
          "priority": "high|medium|low"
        }
      ],
      "keywordOptimization": {
        "missing": ["array de strings"],
        "present": ["array de strings"]
      },
      "actionableExamples": [
        {
          "before": "string",
          "after": "string",
          "explanation": "string"
        }
      ],
      "formatFeedback": {
        "rating": number (1-5),
        "comments": ["array de strings"]
      }
    }

    **Contexto:**
    - Vaga Alvo: __TARGET_ROLE__
    - Nome do Arquivo: __FILE_NAME__
    **Conteúdo do Currículo (em base64):**
    __FILE_CONTENT__
  `;

export async function analyzeCv(fileContent: string, fileName: string, targetRole?: string): Promise<CvAnalysisResult> {
  try {
    // 1. Busca a chave da API do banco de dados
    const apiKey = await storage.getSetting('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("Chave da API Gemini não configurada no painel de admin.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. Busca o nome do modelo do banco de dados
    const modelName = await storage.getSetting('GEMINI_MODEL_NAME');
    const model = genAI.getGenerativeModel({ model: modelName || "gemini-1.5-flash" });

    // 3. Busca o prompt do banco de dados
    const customPrompt = await storage.getSetting('GEMINI_PROMPT_CV_ANALYSIS');
    const promptTemplate = customPrompt || DEFAULT_CV_ANALYSIS_PROMPT;

    // O resto da lógica continua como antes...
    const prompt = promptTemplate
      .replace('__TARGET_ROLE__', targetRole || "Não especificada")
      .replace('__FILE_NAME__', fileName)
      .replace('__FILE_CONTENT__', fileContent.substring(0, 4000) + '...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    if (!analysisText) {
      throw new Error("Resposta vazia da API Gemini");
    }

    // Extract JSON from response (Gemini might include extra text)
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Resposta inválida da API, não contém JSON:", analysisText);
      throw new Error("Formato de resposta inválido da API Gemini");
    }
    
    const analysis: CvAnalysisResult = JSON.parse(jsonMatch[0]);
    
    // Validação e sanitização da resposta da IA
    if (typeof analysis.score !== 'number' || analysis.score < 0 || analysis.score > 100) {
      analysis.score = 0;
    }
    if (!Array.isArray(analysis.actionableExamples)) analysis.actionableExamples = [];

    if (!analysis.formatFeedback) {
      analysis.formatFeedback = { rating: 3, comments: ["Análise de formato indisponível."] };
    }

    if (!analysis.scoreDetails) {
      analysis.scoreDetails = { clarity: 0, experienceImpact: 0, relevance: 0, skills: 0, formatting: 0 };
    }

    return analysis;

  } catch (error) {
    console.error("Error analyzing CV with Gemini:", error);
    throw new Error("Falha na comunicação com a IA para analisar o currículo.");
  }
}