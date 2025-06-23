import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  FileText, 
  Star, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb,
  Target,
  Award
} from "lucide-react";
import { useLocation } from "wouter";

interface CvAnalysis {
  id: number;
  fileName: string;
  score: number;
  createdAt: string;
  analysisResult: {
    overallFeedback: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: Array<{
      category: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    keywordOptimization: {
      missing: string[];
      present: string[];
    };
    formatFeedback: {
      rating: number;
      comments: string[];
    };
  };
}

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: analysis, isLoading, error } = useQuery<CvAnalysis>({
    queryKey: [`/api/analyses/${id}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Análise não encontrada</h1>
            <p className="text-slate-600 mb-4">
              A análise solicitada não foi encontrada ou você não tem permissão para visualizá-la.
            </p>
            <Button onClick={() => setLocation("/")}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-green-600";
    if (score >= 60) return "from-yellow-500 to-yellow-600";
    return "from-red-500 to-red-600";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle size={16} />;
      case 'medium': return <Target size={16} />;
      case 'low': return <CheckCircle size={16} />;
      default: return <Lightbulb size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 apple-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="mr-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Voltar
            </Button>
            <div className="flex items-center space-x-2">
              <FileText className="text-blue-500" size={24} />
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{analysis.fileName}</h1>
                <p className="text-sm text-slate-600">
                  Analisado em {new Date(analysis.createdAt).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="apple-shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getScoreGradient(analysis.score)} flex items-center justify-center mx-auto mb-6`}>
                  <div className="text-4xl font-bold text-white">{analysis.score}</div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Pontuação Geral</h2>
                <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                  {analysis.analysisResult.overallFeedback}
                </p>
                <div className="flex justify-center space-x-8">
                  <div className="text-center">
                    <Award className="text-blue-500 mx-auto mb-2" size={24} />
                    <p className="text-sm text-slate-600">Formato</p>
                    <p className="font-semibold">{analysis.analysisResult.formatFeedback.rating}/5</p>
                  </div>
                  <div className="text-center">
                    <Star className="text-yellow-500 mx-auto mb-2" size={24} />
                    <p className="text-sm text-slate-600">Conteúdo</p>
                    <p className="font-semibold">{Math.round(analysis.score / 20)}/5</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="text-green-500 mx-auto mb-2" size={24} />
                    <p className="text-sm text-slate-600">Otimização</p>
                    <p className="font-semibold">
                      {analysis.analysisResult.keywordOptimization.present.length > 5 ? '5' : analysis.analysisResult.keywordOptimization.present.length}/5
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="apple-shadow h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="mr-2" size={24} />
                  Pontos Fortes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.analysisResult.strengths.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.analysisResult.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-slate-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">Nenhum ponto forte identificado.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Weaknesses */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="apple-shadow h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertCircle className="mr-2" size={24} />
                  Pontos de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.analysisResult.weaknesses.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.analysisResult.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-slate-700">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">Nenhum ponto de melhoria identificado.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="apple-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="mr-2" size={24} />
                Sugestões Detalhadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.analysisResult.suggestions.length > 0 ? (
                <div className="space-y-6">
                  {analysis.analysisResult.suggestions.map((suggestion, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">{suggestion.category}</h4>
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          <div className="flex items-center space-x-1">
                            {getPriorityIcon(suggestion.priority)}
                            <span className="capitalize">{suggestion.priority === 'high' ? 'Alta' : suggestion.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                          </div>
                        </Badge>
                      </div>
                      <p className="text-slate-700">{suggestion.recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">Nenhuma sugestão específica disponível.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Keywords Analysis */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="apple-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="mr-2" size={24} />
                  Palavras-chave Encontradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.analysisResult.keywordOptimization.present.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.analysisResult.keywordOptimization.present.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Nenhuma palavra-chave relevante encontrada.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="apple-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-600">
                  <Target className="mr-2" size={24} />
                  Palavras-chave Sugeridas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.analysisResult.keywordOptimization.missing.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.analysisResult.keywordOptimization.missing.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="border-yellow-300 text-yellow-700">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Seu currículo está bem otimizado em termos de palavras-chave.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Format Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8"
        >
          <Card className="apple-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2" size={24} />
                Avaliação de Formato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-700">Nota do Formato</span>
                  <span className="font-semibold">{analysis.analysisResult.formatFeedback.rating}/5</span>
                </div>
                <Progress 
                  value={(analysis.analysisResult.formatFeedback.rating / 5) * 100} 
                  className="h-2"
                />
              </div>
              
              {analysis.analysisResult.formatFeedback.comments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Comentários sobre o formato:</h4>
                  <ul className="space-y-2">
                    {analysis.analysisResult.formatFeedback.comments.map((comment, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-slate-700">{comment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
