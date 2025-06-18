import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

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
`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em recursos humanos e análise de currículos. Forneça análises detalhadas e construtivas em português brasileiro."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "text", 
              text: `Arquivo: ${fileName}\nConteúdo (base64): ${fileContent.substring(0, 1000)}...`
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.7
    });

    const analysisText = response.choices[0].message.content;
    if (!analysisText) {
      throw new Error("Resposta vazia da API OpenAI");
    }

    const analysis: CvAnalysisResult = JSON.parse(analysisText);
    
    // Validate and sanitize the response
    if (typeof analysis.score !== 'number' || analysis.score < 0 || analysis.score > 100) {
      analysis.score = 50; // Default score
    }

    return analysis;

  } catch (error) {
    console.error("Error analyzing CV with OpenAI:", error);
    
    // Return a fallback analysis if OpenAI fails
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
