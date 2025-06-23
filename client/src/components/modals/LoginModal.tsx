import { useAuth } from "@/hooks/useAuth"; // Garanta que este import esteja aqui
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { toast } = useToast();
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', // Mude de 'name' para 'firstName'
    lastName: '',  // Adicione 'lastName'
    email: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGoogleLogin = () => {
    window.location.href = '/api/login';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ADICIONE ESTA VALIDAÇÃO
    if (isRegisterMode && formData.password !== confirmPassword) {
      toast({
        title: "Erro no cadastro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return; // Impede o envio do formulário
    }

    if (isRegisterMode) {
      register(formData);
    } else {
      login({ email: formData.email, password: formData.password });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setFormData({ firstName: '', lastName: '', email: '', password: '' });
  };

  const isLoading = isLoggingIn || isRegistering;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-slate-900">
            {isRegisterMode ? 'Criar conta' : 'Entre na sua conta'}
          </DialogTitle>
          <p className="text-center text-slate-600">
            {isRegisterMode 
              ? 'Junte-se a milhares de profissionais' 
              : 'Acesse suas análises e histórico'
            }
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Google Login Button */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline" 
            className="w-full py-3 rounded-2xl border-2 hover:bg-gray-50"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isRegisterMode ? 'Cadastrar com Google' : 'Continuar com Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">ou</span>
            </div>
          </div>

          {/* Manual Login/Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seção de Nome e Sobrenome (só aparece no modo de registro) */}
            {isRegisterMode && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1 rounded-2xl"
                    placeholder="Seu nome"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-1 rounded-2xl"
                    placeholder="Seu sobrenome"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Campo de E-mail */}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 rounded-2xl"
                placeholder="Digite seu e-mail"
                required
                disabled={isLoading}
              />
            </div>

            {/* Campo de Senha */}
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 rounded-2xl"
                placeholder="Digite sua senha"
                required
                disabled={isLoading}
              />
            </div>
            
            {/* ---- NOVO CAMPO "CONFIRMAR SENHA" ADICIONADO AQUI ---- */}
            {/* Ele só aparece no modo de registro */}
            {isRegisterMode && (
              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 rounded-2xl"
                  placeholder="Digite sua senha novamente"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Botão de Submit */}
            <Button 
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl"
              disabled={isLoading}
            >
              {isLoading ? 'Aguarde...' : (isRegisterMode ? 'Criar Conta' : 'Entrar')}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-slate-600">
              {isRegisterMode ? 'Já tem conta?' : 'Não tem conta?'}{' '}
              <Button 
                variant="link" 
                onClick={toggleMode}
                className="text-blue-500 font-semibold p-0"
              >
                {isRegisterMode ? 'Entrar' : 'Cadastre-se'}
              </Button>
            </p>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
