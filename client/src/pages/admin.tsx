// client/src/pages/admin.tsx - VERSÃO COMPLETA E CORRIGIDA

import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ApiSettingsForm from "@/components/ApiSettingsForm";
import PromptSettingsForm from "@/components/PromptSettingsForm";
import PaymentSettingsForm from "@/components/PaymentSettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, KeyRound, Bot, Users, ScanLine, Star, UserPlus, Settings, ShoppingCart } from "lucide-react";
import DatabaseStatus from "@/components/DatabaseStatus";
import UserChart from '@/components/UserChart';
import AuthSettingsForm from "@/components/AuthSettingsForm";

// As funções fetchDashboardData e LoadingSpinner continuam as mesmas...
async function fetchDashboardData() {
  const res = await fetch('/api/admin/dashboard-data');
  if (!res.ok) throw new Error('Falha ao carregar dados do dashboard');
  return res.json();
}

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}

function DashboardCardSkeleton() {
  return (
    <Card className="apple-shadow">
      <CardContent className="p-6 flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  // Hooks para autenticação, localização e busca de dados
  const { isLoading: isAuthLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  const { data: adminData, isLoading: isAdminDataLoading } = useQuery({
    queryKey: ['adminDashboardData'],
    queryFn: fetchDashboardData,
    enabled: !!isAdmin, // Só busca os dados se o usuário for admin
  });

  // Efeito de segurança para proteger a rota
  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      setLocation('/'); // Redireciona se não for admin
    }
  }, [isAuthLoading, isAdmin, setLocation]);

  // Exibe um spinner enquanto a autenticação é verificada
  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  // Não renderiza nada se não for admin (o redirecionamento já foi acionado)
  if (!isAdmin) {
    return null;
  }

  // Layout principal da página de admin
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Cabeçalho da Página */}
      <div className="flex items-center space-x-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Painel Administrativo
        </h1>
        <DatabaseStatus />
      </div>
      
      {/* Seção do Dashboard */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center">
          <LayoutDashboard className="mr-3 text-blue-500" />
          Dashboard
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {isAdminDataLoading ? (
            <>
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
            </>
          ) : (
            <>
              <Card className="apple-shadow">
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total de Usuários</p>
                    <p className="text-2xl font-bold text-slate-900">{adminData?.totalUsers}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="apple-shadow">
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg"><ScanLine className="h-6 w-6 text-green-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Análises Totais</p>
                    <p className="text-2xl font-bold text-slate-900">{adminData?.analysesToday}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="apple-shadow">
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="p-3 bg-yellow-100 rounded-lg"><Star className="h-6 w-6 text-yellow-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Média de Pontuação</p>
                    <p className="text-2xl font-bold text-slate-900">{adminData?.averageScore}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="apple-shadow">
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg"><UserPlus className="h-6 w-6 text-purple-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Novos Usuários Hoje</p>
                    <p className="text-2xl font-bold text-slate-900">{adminData?.newUsersToday}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Gráfico de Usuários */}
      <div className="mb-12">
        <UserChart />
      </div>

      {/* Seção de Configurações */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center">
          <Settings className="mr-3 text-slate-600" />
          Configurações
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="apple-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <KeyRound className="mr-3 text-yellow-500" />
                Chaves de API e Modelo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ApiSettingsForm />
            </CardContent>
          </Card>
          
          <Card className="apple-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-3 text-green-500" />
                Prompts da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <PromptSettingsForm />
            </CardContent>
          </Card>
          
          <Card className="apple-shadow lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Users className="mr-3 text-orange-500" />
                Configurações de Autenticação e E-mail
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <AuthSettingsForm />
            </CardContent>
          </Card>
          
          <Card className="apple-shadow lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <ShoppingCart className="mr-3 text-blue-500" />
                Configurações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <PaymentSettingsForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}