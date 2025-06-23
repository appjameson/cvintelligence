import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Brain, Upload, FileText, Star, CreditCard, LogOut, Clock, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import UploadModal from "@/components/modals/UploadModal";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

interface CvAnalysis {
  id: number;
  fileName: string;
  score: number;
  createdAt: string;
  analysisResult: {
    overallFeedback: string;
    suggestions: Array<{
      category: string;
      recommendation: string;
      priority: string;
    }>;
  };
}

export default function Home() {
  const { user, logout, isAdmin } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: analyses, isLoading } = useQuery<CvAnalysis[]>({
    queryKey: ["/api/analyses"],
  });

  const handleLogout = () => {
    logout(); // Simplesmente chamamos a função do hook
  };

  const handleViewAnalysis = (id: number) => {
    setLocation(`/analysis/${id}`);
  };

  const handleBuyCredits = () => {
    setLocation("/checkout");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 apple-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Brain className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-slate-900">cvintelligence</span>
            </div>

            <div className="flex items-center space-x-4">
              {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => setLocation('/admin')}>
                    <Settings size={16} className="mr-2" />
                    Admin
                  </Button>
                )}
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <CreditCard size={16} />
                <span>{user?.credits || 0} créditos</span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleBuyCredits}>
                Comprar Créditos
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut size={16} className="mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Olá, {user?.firstName || 'usuário'}! 👋
          </h1>
          <p className="text-slate-600">
            Pronto para melhorar seu currículo com nossa IA?
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="apple-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="text-blue-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Créditos</p>
                    <p className="text-2xl font-bold text-slate-900">{user?.credits || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="apple-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="text-green-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Análises</p>
                    <p className="text-2xl font-bold text-slate-900">{analyses?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="apple-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="text-yellow-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Média</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {analyses?.length 
                        ? Math.round(analyses.reduce((acc, a) => acc + a.score, 0) / analyses.length)
                        : 0
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="apple-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="text-purple-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Melhor</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {analyses?.length ? Math.max(...analyses.map(a => a.score)) : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-8"
        >
          <Card className="apple-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <Brain className="mx-auto text-blue-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Pronto para uma nova análise?
                </h3>
                <p className="text-slate-600 mb-6">
                  Faça upload do seu currículo e receba insights detalhados em segundos
                </p>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl apple-shadow"
                  disabled={(user?.credits || 0) <= 0}
                >
                  <Upload className="mr-2" size={20} />
                  {(user?.credits || 0) > 0 ? 'Analisar Novo Currículo' : 'Sem Créditos'}
                </Button>
                {(user?.credits || 0) <= 0 && (
                  <p className="text-sm text-red-500 mt-2">
                    Você não tem créditos suficientes. 
                    <Button variant="link" onClick={handleBuyCredits} className="p-0 ml-1">
                      Compre mais créditos
                    </Button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Analyses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="apple-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2" size={24} />
                Suas Análises Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-slate-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : analyses?.length ? (
                <div className="space-y-4">
                  {analyses.slice(0, 5).map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleViewAnalysis(analysis.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{analysis.fileName}</h4>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <Clock size={14} />
                            <span>{new Date(analysis.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={getScoreBadgeColor(analysis.score)}>
                          {analysis.score}/100
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto text-slate-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Nenhuma análise ainda
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Faça upload do seu primeiro currículo para começar
                  </p>
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    variant="outline"
                    disabled={(user?.credits || 0) <= 0}
                  >
                    <Upload className="mr-2" size={16} />
                    Começar Agora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}
