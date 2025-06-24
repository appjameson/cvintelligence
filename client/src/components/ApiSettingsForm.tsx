import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";

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

export default function ApiSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loadedSettings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: fetchSettings,
  });

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Configurações salvas com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  // Um estado individual para cada campo do formulário
  const [geminiKey, setGeminiKey] = useState('');
  const [stripeKey, setStripeKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('');
  const [aiTemperature, setAiTemperature] = useState([0.2]);

  // Estados da UI para mostrar/ocultar senha
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);

  // useEffect para popular os estados locais com os dados da API
  useEffect(() => {
    if (loadedSettings) {
      setGeminiKey(loadedSettings.GEMINI_API_KEY || '');
      setStripeKey(loadedSettings.STRIPE_SECRET_KEY || '');
      setGeminiModel(loadedSettings.GEMINI_MODEL_NAME || 'gemini-1.5-flash');
      
      const tempFromDB = loadedSettings.AI_TEMPERATURE;
      if (tempFromDB && !isNaN(parseFloat(tempFromDB))) {
        setAiTemperature([parseFloat(tempFromDB)]);
      } else {
        setAiTemperature([0.2]);
      }
    }
  }, [loadedSettings]);

  // Reúne os dados dos estados locais para enviar à API
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ 
      GEMINI_API_KEY: geminiKey, 
      STRIPE_SECRET_KEY: stripeKey, 
      GEMINI_MODEL_NAME: geminiModel,
      AI_TEMPERATURE: aiTemperature[0].toString(),
    });
  };
  
  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copiado!", description: `${fieldName} copiada para a área de transferência.` });
    });
  };

  if (isLoading) return <p className="text-sm text-slate-500">Carregando configurações...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="geminiKey">Chave da API Gemini</Label>
        <div className="relative mt-1">
          <Input id="geminiKey" type={showGeminiKey ? 'text' : 'password'} value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="pr-20" />
          <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(geminiKey, 'Chave Gemini')}><Copy size={16} /></Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowGeminiKey(!showGeminiKey)}>{showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}</Button>
          </div>
        </div>
      </div>
      <div>
        <Label htmlFor="geminiModel">Modelo do Gemini</Label>
        <Input id="geminiModel" type="text" value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="temperature">Temperatura da IA ({aiTemperature[0].toFixed(1)})</Label>
        <div className="flex items-center space-x-4 pt-2">
          <span className="text-sm text-slate-600">Consistente</span>
          <Slider id="temperature" value={aiTemperature} onValueChange={setAiTemperature} min={0} max={1} step={0.1} />
          <span className="text-sm text-slate-600">Criativo</span>
        </div>
      </div>
      <div>
        <Label htmlFor="stripeKey">Chave Secreta do Stripe</Label>
        <div className="relative mt-1">
          <Input id="stripeKey" type={showStripeKey ? 'text' : 'password'} value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} className="pr-20" />
          <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(stripeKey, 'Chave Stripe')}><Copy size={16} /></Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowStripeKey(!showStripeKey)}>{showStripeKey ? <EyeOff size={16} /> : <Eye size={16} />}</Button>
          </div>
        </div>
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </form>
  );
}