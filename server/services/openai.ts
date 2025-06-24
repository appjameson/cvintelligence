import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { storage } from "../storage";
import fs from "fs";
import { analysisResultSchema } from "../../shared/schema";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

interface CvAnalysisResult {
  score: number;
  detectedSections: string[];
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
  extractedData: {
    name: string;
    email: string;
    phone: string;
    summary: string;
    recentExperience: string;
  };
  comparativeFeedback?: { // <-- Objeto opcional
    improvementsMade: string[];
    pointsToStillImprove: string[];
  };
}

export const DEFAULT_CV_ANALYSIS_PROMPT = `
**PERSONA:** Você é um Recrutador Sênior e Especialista em Carreiras...

**TAREFA:**
Sua primeira tarefa é extrair as seguintes informações-chave do currículo: o nome completo do candidato, seu principal e-mail, seu principal telefone, o parágrafo de resumo/objetivo profissional, e a descrição completa de sua experiência de trabalho mais recente. Se um campo não for encontrado, retorne uma string vazia ("").
Depois, prossiga com a análise completa baseada na rubrica. Sempre inclua nome da pessoa do curriculo no feedback.

**Rubrica de Pontuação (Total Máximo: 100 pontos):**
    - Clareza e Objetividade (Máx 15 pts)
    - Impacto e Resultados na Experiência (Máx 30 pts)
    - Relevância para a Vaga (Máx 25 pts)
    - Habilidades e Competências (Máx 15 pts)
    - Formatação e Profissionalismo (Máx 15 pts)

**ETAPA ADICIONAL: Análise Comparativa (se aplicável)**
Se dados de uma análise anterior forem fornecidos, compare o currículo atual com as fraquezas e sugestões da versão antiga. Liste quais pontos foram melhorados e quais ainda precisam de atenção.

**FORMATO DE SAÍDA OBRIGATÓRIO (APENAS O OBJETO JSON):**
{
  "extractedData": {
    "name": "string - O nome completo encontrado no currículo",
    "email": "string - O e-mail de contato encontrado",
    "phone": "string - O telefone de contato encontrado",
    "summary": "string - O parágrafo de resumo ou objetivo profissional do candidato",
    "recentExperience": "string - A descrição da experiência de trabalho mais recente listada"
  },
  "score": number,
  "scoreDetails": { "clarity": number, "experienceImpact": number, "relevance": number, "skills": number, "formatting": number },
  "overallFeedback": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": [{"category": "string", "recommendation": "string", "priority": "high|medium|low"}],
  "keywordOptimization": { "missing": ["string"], "present": ["string"] },
  "actionableExamples": [{"before": "string", "after": "string", "explanation": "string"}],
  "formatFeedback": { "rating": number, "comments": ["string"] }
  "comparativeFeedback": {
    "improvementsMade": ["array de strings descrevendo melhorias aplicadas"],
    "pointsToStillImprove": ["array de strings com sugestões antigas que ainda são válidas"]
  },
}



**Contexto Adicional:**
- Vaga Alvo: __TARGET_ROLE__
- Nome do Arquivo: __FILE_NAME__
**DADOS DA ANÁLISE ANTERIOR (se aplicável, senão ignore):**
__PREVIOUS_ANALYSIS__
`;

export async function analyzeCv(filePath: string, mimeType: string, fileName: string, targetRole?: string, previousAnalysis?: CvAnalysis): Promise<CvAnalysisResult> {
  let uploadedFile;
  try {
    const apiKey = await storage.getSetting('GEMINI_API_KEY');
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new Error("Chave da API Gemini não configurada corretamente no painel de admin.");
    }
    const apiKeyTrimmed = apiKey.trim();

    const genAI = new GoogleGenerativeAI(apiKeyTrimmed);
    const fileManager = new GoogleAIFileManager(apiKeyTrimmed);

    const modelName = await storage.getSetting('GEMINI_MODEL_NAME');
    const model = genAI.getGenerativeModel({ model: modelName || "gemini-1.5-flash" });

    uploadedFile = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName: fileName,
    });
    
    let previousAnalysisData = "Nenhuma análise anterior fornecida.";

    if (previousAnalysis) {
      // Usamos o safeParse para validar o objeto de tipo 'unknown'
      const parsedResult = analysisResultSchema.safeParse(previousAnalysis.analysisResult);

      if (parsedResult.success) {
        // Se a validação passar, o TypeScript agora sabe que parsedResult.data tem as propriedades que queremos!
        const weaknesses = parsedResult.data.weaknesses || [];
        const suggestions = parsedResult.data.suggestions || [];

        previousAnalysisData = `Fraquezas Anteriores: ${JSON.stringify(weaknesses)}. Sugestões Anteriores: ${JSON.stringify(suggestions)}`;
      }
    }

    // O CÓDIGO ABAIXO AGORA EXECUTA INDEPENDENTEMENTE DO 'if' ACIMA.
    const customPrompt = await storage.getSetting('GEMINI_PROMPT_CV_ANALYSIS');
    const promptTemplate = customPrompt || DEFAULT_CV_ANALYSIS_PROMPT;

    const prompt = promptTemplate
      .replace('__TARGET_ROLE__', targetRole || "Não especificada")
      .replace('__FILE_NAME__', fileName)
      .replace('__PREVIOUS_ANALYSIS__', previousAnalysisData);


    // Busca a configuração de temperatura do banco
    const temperatureSetting = await storage.getSetting('AI_TEMPERATURE');

    // Converte para número. Se não existir, usa 0.2 como padrão.
    const temperature = temperatureSetting ? parseFloat(temperatureSetting) : 0.2;
    
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { fileData: { mimeType: uploadedFile.file.mimeType, fileUri: uploadedFile.file.uri } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: temperature
      },
    });

    const response = result.response;
    const analysis: CvAnalysisResult = JSON.parse(response.text());

    return analysis;

  } catch (error) {
    console.error("ERRO na função analyzeCv:", error);
    throw new Error("Falha na comunicação com a IA para analisar o currículo.");
  } finally {
    if (uploadedFile?.file?.name) {
      try {
        const apiKey = await storage.getSetting('GEMINI_API_KEY');
        if (apiKey) {
          const fileManagerForDelete = new GoogleAIFileManager(apiKey.trim());
          await fileManagerForDelete.deleteFile(uploadedFile.file.name);
          console.log('[FINALLY] Arquivo temporário da IA deletado com sucesso.');
        }
      } catch (deleteError) {
        console.error("[FINALLY] Erro ao deletar o arquivo temporário da IA:", deleteError);
      }
    }
  }
}