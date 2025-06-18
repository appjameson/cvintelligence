import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

interface CvAnalysisResult {
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
  formatFeedback: {
    rating: number;
    comments: string[];
  };
}

export async function analyzeCv(fileContent: string, fileName: string): Promise<CvAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Analise este currículo em português brasileiro e forneça uma avaliação detalhada no formato JSON.

Considere os seguintes aspectos:
1. Estrutura e formatação
2. Conteúdo e relevância das informações
3. Palavras-chave e termos técnicos
4. Experiência profissional
5. Formação acadêmica
6. Habilidades técnicas e comportamentais
7. Clareza e objetividade

Responda em português brasileiro com o seguinte formato JSON:
{
  "score": number (0-100),
  "overallFeedback": "string - feedback geral sobre o currículo",
  "strengths": ["array de pontos fortes"],
  "weaknesses": ["array de pontos fracos"],
  "suggestions": [
    {
      "category": "string - categoria da sugestão",
      "recommendation": "string - recomendação específica",
      "priority": "high|medium|low"
    }
  ],
  "keywordOptimization": {
    "missing": ["palavras-chave que faltam"],
    "present": ["palavras-chave encontradas"]
  },
  "formatFeedback": {
    "rating": number (1-5),
    "comments": ["comentários sobre formatação"]
  }
}

Seja específico, construtivo e forneça sugestões práticas para melhorar o currículo.

Arquivo: ${fileName}
Conteúdo do currículo (base64): ${fileContent.substring(0, 2000)}...
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    if (!analysisText) {
      throw new Error("Resposta vazia da API Gemini");
    }

    // Extract JSON from response (Gemini might include extra text)
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Formato de resposta inválido da API Gemini");
    }

    const analysis: CvAnalysisResult = JSON.parse(jsonMatch[0]);
    
    // Validate and sanitize the response
    if (typeof analysis.score !== 'number' || analysis.score < 0 || analysis.score > 100) {
      analysis.score = 70; // Default score
    }

    // Ensure arrays exist
    if (!Array.isArray(analysis.strengths)) analysis.strengths = [];
    if (!Array.isArray(analysis.weaknesses)) analysis.weaknesses = [];
    if (!Array.isArray(analysis.suggestions)) analysis.suggestions = [];
    if (!analysis.keywordOptimization) {
      analysis.keywordOptimization = { missing: [], present: [] };
    }
    if (!analysis.formatFeedback) {
      analysis.formatFeedback = { rating: 3, comments: [] };
    }

    return analysis;

  } catch (error) {
    console.error("Error analyzing CV with Gemini:", error);
    
    // Return a fallback analysis if Gemini fails
    return {
      score: 70,
      overallFeedback: "Não foi possível analisar completamente o currículo no momento. Tente novamente mais tarde.",
      strengths: ["Currículo enviado com sucesso"],
      weaknesses: ["Análise temporariamente indisponível"],
      suggestions: [
        {
          category: "Sistema",
          recommendation: "Tente fazer o upload novamente em alguns minutos",
          priority: "medium"
        }
      ],
      keywordOptimization: {
        missing: [],
        present: []
      },
      formatFeedback: {
        rating: 3,
        comments: ["Análise de formato temporariamente indisponível"]
      }
    };
  }
}
