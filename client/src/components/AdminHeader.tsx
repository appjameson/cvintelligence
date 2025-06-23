// client/src/components/AdminHeader.tsx

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Brain, CreditCard, LogOut, ArrowLeft, Settings } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <header className="bg-white border-b border-slate-200 apple-shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Brain className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-slate-900">cvintelligence</span>
            <span className="text-sm font-semibold text-slate-500 ml-2 border-l pl-4">Painel do Admin</span>
          </div>

          {/* Menu de Ações */}
          <div className="flex items-center space-x-4">
            {/* Botão para voltar para o Dashboard do Usuário */}
            <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
              <ArrowLeft size={16} className="mr-2" />
              Voltar ao App
            </Button>

            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <CreditCard size={16} />
              <span>{user?.credits || 0} créditos</span>
            </div>
            
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}