import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

async function sendTestEmail() {
  const res = await fetch('/api/admin/test-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    // ADICIONE ESTA LINHA CRUCIAL:
    credentials: 'include',
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Falha no envio do e-mail de teste');
  }
  return data;
}

// Funções de API
async function fetchSettings() {
  const res = await fetch('/api/admin/settings');
  if (!res.ok) throw new Error('Falha ao carregar configurações');
  return res.json();
}

async function saveSettings(settings: Record<string, any>) {
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
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

  const { data: loadedSettings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: fetchSettings,
  });

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Configurações de autenticação salvas." });
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  // A segunda mutação agora tem um nome único
  const testEmailMutation = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: (data) => {
      toast({ title: "Envio Concluído", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Falha no Teste", description: error.message, variant: "destructive" });
    }
  });

  // Apenas UMA declaração da função handleTestEmail
  const handleTestEmail = () => {
    toast({ title: "Enviando...", description: `Tentando enviar e-mail de teste para sua conta logada.`});
    testEmailMutation.mutate();
  };

  // Estados individuais para cada campo
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [allowNewRegistrations, setAllowNewRegistrations] = useState(false);
  const [requireEmailConfirmation, setRequireEmailConfirmation] = useState(false);

  // useEffect que popula todos os estados locais
  useEffect(() => {
    if (loadedSettings) {
      setGoogleClientId(loadedSettings.GOOGLE_CLIENT_ID || '');
      setGoogleClientSecret(loadedSettings.GOOGLE_CLIENT_SECRET || '');
      setSmtpHost(loadedSettings.EMAIL_SMTP_HOST || '');
      setSmtpPort(loadedSettings.EMAIL_SMTP_PORT || '');
      setSmtpUser(loadedSettings.EMAIL_SMTP_USER || '');
      setSmtpPassword(loadedSettings.EMAIL_SMTP_PASSWORD || '');
      setEmailFrom(loadedSettings.EMAIL_FROM_ADDRESS || '');
      setAllowNewRegistrations(String(loadedSettings.ALLOW_NEW_REGISTRATIONS) === 'true');
      setRequireEmailConfirmation(String(loadedSettings.REQUIRE_EMAIL_CONFIRMATION) === 'true');
    }
  }, [loadedSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      GOOGLE_CLIENT_ID: googleClientId,
      GOOGLE_CLIENT_SECRET: googleClientSecret,
      EMAIL_SMTP_HOST: smtpHost,
      EMAIL_SMTP_PORT: smtpPort,
      EMAIL_SMTP_USER: smtpUser,
      EMAIL_SMTP_PASSWORD: smtpPassword,
      EMAIL_FROM_ADDRESS: emailFrom,
      ALLOW_NEW_REGISTRATIONS: allowNewRegistrations,
      REQUIRE_EMAIL_CONFIRMATION: requireEmailConfirmation,
    });
  };
  
  if (isLoading) return <p className="text-sm text-slate-500">Carregando...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toggles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <Label htmlFor="allowNewRegistrations" className="cursor-pointer">Permitir novos cadastros</Label>
          <Switch id="allowNewRegistrations" checked={allowNewRegistrations} onCheckedChange={setAllowNewRegistrations} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <Label htmlFor="requireEmailConfirmation" className="cursor-pointer">Exigir confirmação de e-mail</Label>
          <Switch id="requireEmailConfirmation" checked={requireEmailConfirmation} onCheckedChange={setRequireEmailConfirmation} />
        </div>
      </div>
      
      {/* Google Auth */}
      <div className="space-y-4 rounded-lg border p-4">
        <h4 className="font-medium">Autenticação com Google</h4>
        <div>
          <Label htmlFor="googleId">Google Client ID</Label>
          <Input id="googleId" value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="googleSecret">Google Client Secret</Label>
          <Input id="googleSecret" type="password" value={googleClientSecret} onChange={(e) => setGoogleClientSecret(e.target.value)} />
        </div>
      </div>

      {/* Email SMTP */}
      <div className="space-y-4 rounded-lg border p-4">
        <h4 className="font-medium text-slate-800">Configurações de E-mail (SMTP)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smtpHost">Host SMTP</Label>
            <Input id="smtpHost" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.example.com" />
          </div>
          <div>
            <Label htmlFor="smtpPort">Porta SMTP</Label>
            <Input id="smtpPort" type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" />
          </div>
        </div>
        <div>
          <Label htmlFor="emailFrom">E-mail Remetente</Label>
          <Input id="emailFrom" type="email" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} placeholder="noreply@cvintelligence.com" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smtpUser">Usuário SMTP</Label>
            <Input id="smtpUser" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="smtpPassword">Senha SMTP</Label>
            <Input id="smtpPassword" type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} />
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleTestEmail} disabled={testEmailMutation.isPending}>
          {testEmailMutation.isPending ? 'Enviando...' : 'Testar Configuração'}
        </Button>
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </form>
  );
}