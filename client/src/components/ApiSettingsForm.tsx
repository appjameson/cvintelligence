// client/src/components/ApiSettingsForm.tsx - VERSÃO CORRIGIDA

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";

// --- FUNÇÕES DE API QUE ESTAVAM FALTANDO ---
async function fetchSettings() {
  const res = await fetch('/api/admin/settings');
  if (!res.ok) throw new Error('Falha ao carregar configurações');
  return res.json();
}

async function saveSettings(settings: { geminiKey?: string; stripeKey?: string; geminiModel?: string }) {
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
// --- FIM DAS FUNÇÕES DE API ---


export default function ApiSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [geminiKey, setGeminiKey] = useState('');
  const [stripeKey, setStripeKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('');

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (settings) {
      setGeminiKey(settings.GEMINI_API_KEY || '');
      setStripeKey(settings.STRIPE_SECRET_KEY || '');
      setGeminiModel(settings.GEMINI_MODEL_NAME || '');
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Configurações salvas com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ geminiKey, stripeKey, geminiModel });
  };
  
  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copiado!", description: `${fieldName} copiada para a área de transferência.` });
    }, (err) => {
      toast({ title: "Erro", description: `Não foi possível copiar: ${err}`, variant: 'destructive' });
    });
  };

  if (isLoading) return <p>Carregando configurações...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campo da Chave Gemini */}
      <div>
        <Label htmlFor="geminiKey">Chave da API Gemini</Label>
        <div className="relative mt-1">
          <Input
            id="geminiKey"
            type={showGeminiKey ? 'text' : 'password'}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="sk-..."
            className="pr-20"
          />
          <div className="absolute inset-y-0 right-0 pr-1 flex items-center space-x-1">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(geminiKey, 'Chave Gemini')}>
              <Copy size={16} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowGeminiKey(!showGeminiKey)}>
              {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Campo do Modelo Gemini */}
      <div>
        <Label htmlFor="geminiModel">Modelo do Gemini</Label>
        <Input
          id="geminiModel"
          type="text"
          value={geminiModel}
          onChange={(e) => setGeminiModel(e.target.value)}
          placeholder="ex: gemini-1.5-flash"
        />
      </div>

      {/* Campo da Chave Stripe */}
      <div>
        <Label htmlFor="stripeKey">Chave Secreta do Stripe</Label>
        <div className="relative mt-1">
          <Input
            id="stripeKey"
            type={showStripeKey ? 'text' : 'password'}
            value={stripeKey}
            onChange={(e) => setStripeKey(e.target.value)}
            placeholder="sk_live_..."
            className="pr-20"
          />
          <div className="absolute inset-y-0 right-0 pr-1 flex items-center space-x-1">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(stripeKey, 'Chave Stripe')}>
              <Copy size={16} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowStripeKey(!showStripeKey)}>
              {showStripeKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </form>
  );
}