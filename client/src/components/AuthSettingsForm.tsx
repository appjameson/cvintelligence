import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// Funções de API (podem ser movidas para um arquivo central depois)
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
    throw new Error(errorData.message || 'Falha ao salvar configurações');
  }
  return res.json();
}

export default function AuthSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para todos os campos do formulário
  const [settings, setSettings] = useState({
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    EMAIL_SMTP_HOST: '',
    EMAIL_SMTP_PORT: '',
    EMAIL_SMTP_USER: '',
    EMAIL_SMTP_PASSWORD: '',
    EMAIL_FROM_ADDRESS: '',
    ALLOW_NEW_REGISTRATIONS: true,
    REQUIRE_EMAIL_CONFIRMATION: false,
  });

  const { data: loadedSettings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: fetchSettings,
  });

  // Atualiza o estado do formulário quando os dados são carregados
  useEffect(() => {
    if (loadedSettings) {
      setSettings(prev => ({
        ...prev,
        ...loadedSettings,
        // Converte strings 'true'/'false' para booleano para os Switches
        ALLOW_NEW_REGISTRATIONS: loadedSettings.ALLOW_NEW_REGISTRATIONS === 'true',
        REQUIRE_EMAIL_CONFIRMATION: loadedSettings.REQUIRE_EMAIL_CONFIRMATION === 'true',
      }));
    }
  }, [loadedSettings]);

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Configurações de autenticação salvas." });
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (checked: boolean, name: string) => {
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(settings);
  };
  
  if (isLoading) return <p>Carregando configurações...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toggles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <Label htmlFor="ALLOW_NEW_REGISTRATIONS">Permitir novos cadastros</Label>
          <Switch
            id="ALLOW_NEW_REGISTRATIONS"
            checked={settings.ALLOW_NEW_REGISTRATIONS}
            onCheckedChange={(checked) => handleSwitchChange(checked, 'ALLOW_NEW_REGISTRATIONS')}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <Label htmlFor="REQUIRE_EMAIL_CONFIRMATION">Exigir confirmação de e-mail</Label>
          <Switch
            id="REQUIRE_EMAIL_CONFIRMATION"
            checked={settings.REQUIRE_EMAIL_CONFIRMATION}
            onCheckedChange={(checked) => handleSwitchChange(checked, 'REQUIRE_EMAIL_CONFIRMATION')}
          />
        </div>
      </div>
      
      {/* Google Auth */}
      <div className="space-y-4">
        <h4 className="font-medium">Autenticação com Google</h4>
        <div>
          <Label htmlFor="GOOGLE_CLIENT_ID">Google Client ID</Label>
          <Input id="GOOGLE_CLIENT_ID" name="GOOGLE_CLIENT_ID" value={settings.GOOGLE_CLIENT_ID} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="GOOGLE_CLIENT_SECRET">Google Client Secret</Label>
          <Input id="GOOGLE_CLIENT_SECRET" name="GOOGLE_CLIENT_SECRET" type="password" value={settings.GOOGLE_CLIENT_SECRET} onChange={handleInputChange} />
        </div>
      </div>

      {/* Email SMTP */}
    <div className="space-y-4 rounded-lg border p-4">
    <h4 className="font-medium text-slate-800">Configurações de E-mail (SMTP)</h4>
    <p className="text-sm text-slate-500">
        Configurações para o envio de e-mails transacionais, como confirmação de cadastro e redefinição de senha.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
        <Label htmlFor="EMAIL_SMTP_HOST">Host SMTP</Label>
        <Input id="EMAIL_SMTP_HOST" name="EMAIL_SMTP_HOST" value={settings.EMAIL_SMTP_HOST || ''} onChange={handleInputChange} placeholder="smtp.example.com" />
        </div>
        <div>
        <Label htmlFor="EMAIL_SMTP_PORT">Porta SMTP</Label>
        <Input id="EMAIL_SMTP_PORT" name="EMAIL_SMTP_PORT" type="number" value={settings.EMAIL_SMTP_PORT || ''} onChange={handleInputChange} placeholder="587" />
        </div>
    </div>

    <div>
        <Label htmlFor="EMAIL_FROM_ADDRESS">E-mail Remetente</Label>
        <Input id="EMAIL_FROM_ADDRESS" name="EMAIL_FROM_ADDRESS" type="email" value={settings.EMAIL_FROM_ADDRESS || ''} onChange={handleInputChange} placeholder="noreply@cvintelligence.com" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
        <Label htmlFor="EMAIL_SMTP_USER">Usuário SMTP</Label>
        <Input id="EMAIL_SMTP_USER" name="EMAIL_SMTP_USER" value={settings.EMAIL_SMTP_USER || ''} onChange={handleInputChange} />
        </div>
        <div>
        <Label htmlFor="EMAIL_SMTP_PASSWORD">Senha SMTP</Label>
        <Input id="EMAIL_SMTP_PASSWORD" name="EMAIL_SMTP_PASSWORD" type="password" value={settings.EMAIL_SMTP_PASSWORD || ''} onChange={handleInputChange} />
        </div>
    </div>
    </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando...' : 'Salvar Configurações de Autenticação'}
      </Button>
    </form>
  );
}