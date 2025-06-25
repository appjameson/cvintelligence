import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail } from "lucide-react";

async function sendTestEmail() {
  const res = await fetch('/api/admin/test-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    credentials: 'include',
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Falha no envio do e-mail de teste');
  }
  return data;
}

async function fetchSettings() {
  const res = await fetch('/api/admin/auth-settings');
  if (!res.ok) throw new Error('Falha ao carregar configurações');
  return res.json();
}

async function saveSettings(settings: Record<string, any>) {
  const res = await fetch('/api/admin/auth-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Falha ao salvar as configurações');
  }
  return res.json();
}

export default function AuthSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(true);
  const [emailSettings, setEmailSettings] = useState({
    host: '',
    port: '',
    secure: false,
    user: '',
    password: ''
  });

  const { data: loadedSettings, isLoading } = useQuery({
    queryKey: ['authSettings'],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (loadedSettings) {
      setGoogleAuthEnabled(loadedSettings.GOOGLE_AUTH_ENABLED === 'true');
      setEmailSettings({
        host: loadedSettings.EMAIL_HOST || '',
        port: loadedSettings.EMAIL_PORT || '',
        secure: loadedSettings.EMAIL_SECURE === 'true',
        user: loadedSettings.EMAIL_USER || '',
        password: loadedSettings.EMAIL_PASSWORD || ''
      });
    }
  }, [loadedSettings]);

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Configurações de autenticação salvas." });
      queryClient.invalidateQueries({ queryKey: ['authSettings'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const testEmailMutation = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: (data) => {
      toast({ title: "Envio Concluído", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Falha no Teste", description: error.message, variant: "destructive" });
    }
  });

  const handleTestEmail = () => {
    toast({ title: "Enviando...", description: "Tentando enviar e-mail de teste para sua conta logada." });
    testEmailMutation.mutate();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const settings = {
      GOOGLE_AUTH_ENABLED: googleAuthEnabled.toString(),
      EMAIL_HOST: emailSettings.host,
      EMAIL_PORT: emailSettings.port,
      EMAIL_SECURE: emailSettings.secure.toString(),
      EMAIL_USER: emailSettings.user,
      EMAIL_PASSWORD: emailSettings.password,
    };
    
    mutation.mutate(settings);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <Card className="apple-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Configurações de Autenticação
        </CardTitle>
        <CardDescription>
          Configure métodos de login e notificações por e-mail
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configurações de Login */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Métodos de Login</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="google-auth"
                checked={googleAuthEnabled}
                onCheckedChange={setGoogleAuthEnabled}
              />
              <Label htmlFor="google-auth">Permitir login com conta Google</Label>
            </div>
            
            <p className="text-sm text-gray-600">
              Quando desativado, a opção de login com Google será removida da página inicial
            </p>
          </div>

          <Separator />

          {/* Configurações de E-mail */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Configurações de E-mail
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email-host">Servidor SMTP</Label>
                <Input
                  id="email-host"
                  value={emailSettings.host}
                  onChange={(e) => setEmailSettings({...emailSettings, host: e.target.value})}
                  placeholder="smtp.gmail.com"
                />
              </div>
              
              <div>
                <Label htmlFor="email-port">Porta</Label>
                <Input
                  id="email-port"
                  type="number"
                  value={emailSettings.port}
                  onChange={(e) => setEmailSettings({...emailSettings, port: e.target.value})}
                  placeholder="587"
                />
              </div>
              
              <div>
                <Label htmlFor="email-user">Usuário</Label>
                <Input
                  id="email-user"
                  type="email"
                  value={emailSettings.user}
                  onChange={(e) => setEmailSettings({...emailSettings, user: e.target.value})}
                  placeholder="seu-email@gmail.com"
                />
              </div>
              
              <div>
                <Label htmlFor="email-password">Senha</Label>
                <Input
                  id="email-password"
                  type="password"
                  value={emailSettings.password}
                  onChange={(e) => setEmailSettings({...emailSettings, password: e.target.value})}
                  placeholder="sua-senha-de-app"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="email-secure"
                checked={emailSettings.secure}
                onCheckedChange={(checked) => setEmailSettings({...emailSettings, secure: checked})}
              />
              <Label htmlFor="email-secure">Usar conexão segura (TLS)</Label>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleTestEmail} disabled={testEmailMutation.isPending}>
                {testEmailMutation.isPending ? 'Enviando...' : 'Testar E-mail'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}