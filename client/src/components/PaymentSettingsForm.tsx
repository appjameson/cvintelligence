import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Package, Settings } from "lucide-react";

async function fetchPaymentSettings() {
  const res = await fetch('/api/admin/payment-settings');
  if (!res.ok) throw new Error('Erro ao carregar configurações de pagamento');
  return res.json();
}

async function savePaymentSettings(settings: Record<string, any>) {
  const res = await fetch('/api/admin/payment-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Erro ao salvar configurações de pagamento');
  return res.json();
}

export default function PaymentSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripePriceId, setStripePriceId] = useState('');
  const [stripeSubscriptionPriceId, setStripeSubscriptionPriceId] = useState('');
  const [stripeWebhooksSecret, setStripeWebhooksSecret] = useState('');
  
  // Configurações dos pacotes de crédito
  const [basicName, setBasicName] = useState('');
  const [basicCredits, setBasicCredits] = useState('');
  const [basicPrice, setBasicPrice] = useState('');
  const [basicDescription, setBasicDescription] = useState('');
  
  const [premiumName, setPremiumName] = useState('');
  const [premiumCredits, setPremiumCredits] = useState('');
  const [premiumPrice, setPremiumPrice] = useState('');
  const [premiumDescription, setPremiumDescription] = useState('');
  
  const [ultimateName, setUltimateName] = useState('');
  const [ultimateCredits, setUltimateCredits] = useState('');
  const [ultimatePrice, setUltimatePrice] = useState('');
  const [ultimateDescription, setUltimateDescription] = useState('');

  const { data: loadedSettings, isLoading } = useQuery({
    queryKey: ['paymentSettings'],
    queryFn: fetchPaymentSettings,
  });

  useEffect(() => {
    if (loadedSettings) {
      setStripeEnabled(loadedSettings.STRIPE_ENABLED === 'true');
      setStripeSecretKey(loadedSettings.STRIPE_SECRET_KEY || '');
      setStripePublicKey(loadedSettings.VITE_STRIPE_PUBLIC_KEY || '');
      setStripePriceId(loadedSettings.STRIPE_PRICE_ID || '');
      setStripeSubscriptionPriceId(loadedSettings.STRIPE_SUBSCRIPTION_PRICE_ID || '');
      setStripeWebhooksSecret(loadedSettings.STRIPE_WEBHOOKS_SECRET || '');
      
      // Pacotes de crédito
      setBasicName(loadedSettings.CREDIT_BASIC_NAME || '');
      setBasicCredits(loadedSettings.CREDIT_BASIC_CREDITS || '');
      setBasicPrice(loadedSettings.CREDIT_BASIC_PRICE || '');
      setBasicDescription(loadedSettings.CREDIT_BASIC_DESCRIPTION || '');
      
      setPremiumName(loadedSettings.CREDIT_PREMIUM_NAME || '');
      setPremiumCredits(loadedSettings.CREDIT_PREMIUM_CREDITS || '');
      setPremiumPrice(loadedSettings.CREDIT_PREMIUM_PRICE || '');
      setPremiumDescription(loadedSettings.CREDIT_PREMIUM_DESCRIPTION || '');
      
      setUltimateName(loadedSettings.CREDIT_ULTIMATE_NAME || '');
      setUltimateCredits(loadedSettings.CREDIT_ULTIMATE_CREDITS || '');
      setUltimatePrice(loadedSettings.CREDIT_ULTIMATE_PRICE || '');
      setUltimateDescription(loadedSettings.CREDIT_ULTIMATE_DESCRIPTION || '');
    }
  }, [loadedSettings]);

  const mutation = useMutation({
    mutationFn: savePaymentSettings,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Configurações de pagamento salvas." });
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const settings = {
      STRIPE_ENABLED: stripeEnabled.toString(),
      STRIPE_SECRET_KEY: stripeSecretKey,
      VITE_STRIPE_PUBLIC_KEY: stripePublicKey,
      STRIPE_PRICE_ID: stripePriceId,
      STRIPE_SUBSCRIPTION_PRICE_ID: stripeSubscriptionPriceId,
      STRIPE_WEBHOOKS_SECRET: stripeWebhooksSecret,
      
      CREDIT_BASIC_NAME: basicName,
      CREDIT_BASIC_CREDITS: basicCredits,
      CREDIT_BASIC_PRICE: basicPrice,
      CREDIT_BASIC_DESCRIPTION: basicDescription,
      
      CREDIT_PREMIUM_NAME: premiumName,
      CREDIT_PREMIUM_CREDITS: premiumCredits,
      CREDIT_PREMIUM_PRICE: premiumPrice,
      CREDIT_PREMIUM_DESCRIPTION: premiumDescription,
      
      CREDIT_ULTIMATE_NAME: ultimateName,
      CREDIT_ULTIMATE_CREDITS: ultimateCredits,
      CREDIT_ULTIMATE_PRICE: ultimatePrice,
      CREDIT_ULTIMATE_DESCRIPTION: ultimateDescription,
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
          <CreditCard className="h-5 w-5" />
          Configurações de Pagamento
        </CardTitle>
        <CardDescription>
          Configure o sistema de pagamentos e pacotes de créditos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="stripe" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="packages">Pacotes</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stripe" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="stripe-enabled"
                  checked={stripeEnabled}
                  onCheckedChange={setStripeEnabled}
                />
                <Label htmlFor="stripe-enabled">Ativar pagamentos com Stripe</Label>
              </div>
              
              {stripeEnabled && (
                <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stripe-secret">Chave Secreta do Stripe</Label>
                      <Input
                        id="stripe-secret"
                        type="password"
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder="sk_..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="stripe-public">Chave Pública do Stripe</Label>
                      <Input
                        id="stripe-public"
                        value={stripePublicKey}
                        onChange={(e) => setStripePublicKey(e.target.value)}
                        placeholder="pk_..."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stripe-price">Price ID (Pagamento único)</Label>
                      <Input
                        id="stripe-price"
                        value={stripePriceId}
                        onChange={(e) => setStripePriceId(e.target.value)}
                        placeholder="price_..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="stripe-subscription">Price ID (Assinatura)</Label>
                      <Input
                        id="stripe-subscription"
                        value={stripeSubscriptionPriceId}
                        onChange={(e) => setStripeSubscriptionPriceId(e.target.value)}
                        placeholder="price_..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="packages" className="space-y-4">
              <div className="grid gap-6">
                {/* Pacote Básico */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pacote Básico</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="basic-name">Nome do Pacote</Label>
                      <Input
                        id="basic-name"
                        value={basicName}
                        onChange={(e) => setBasicName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="basic-credits">Quantidade de Créditos</Label>
                      <Input
                        id="basic-credits"
                        type="number"
                        value={basicCredits}
                        onChange={(e) => setBasicCredits(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="basic-price">Preço (em centavos)</Label>
                      <Input
                        id="basic-price"
                        type="number"
                        value={basicPrice}
                        onChange={(e) => setBasicPrice(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="basic-description">Descrição</Label>
                      <Textarea
                        id="basic-description"
                        value={basicDescription}
                        onChange={(e) => setBasicDescription(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Pacote Premium */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pacote Premium</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="premium-name">Nome do Pacote</Label>
                      <Input
                        id="premium-name"
                        value={premiumName}
                        onChange={(e) => setPremiumName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="premium-credits">Quantidade de Créditos</Label>
                      <Input
                        id="premium-credits"
                        type="number"
                        value={premiumCredits}
                        onChange={(e) => setPremiumCredits(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="premium-price">Preço (em centavos)</Label>
                      <Input
                        id="premium-price"
                        type="number"
                        value={premiumPrice}
                        onChange={(e) => setPremiumPrice(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="premium-description">Descrição</Label>
                      <Textarea
                        id="premium-description"
                        value={premiumDescription}
                        onChange={(e) => setPremiumDescription(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Pacote Ultimate */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pacote Ultimate</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ultimate-name">Nome do Pacote</Label>
                      <Input
                        id="ultimate-name"
                        value={ultimateName}
                        onChange={(e) => setUltimateName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ultimate-credits">Quantidade de Créditos</Label>
                      <Input
                        id="ultimate-credits"
                        type="number"
                        value={ultimateCredits}
                        onChange={(e) => setUltimateCredits(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ultimate-price">Preço (em centavos)</Label>
                      <Input
                        id="ultimate-price"
                        type="number"
                        value={ultimatePrice}
                        onChange={(e) => setUltimatePrice(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="ultimate-description">Descrição</Label>
                      <Textarea
                        id="ultimate-description"
                        value={ultimateDescription}
                        onChange={(e) => setUltimateDescription(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações Avançadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="webhooks-secret">Stripe Webhooks Secret</Label>
                    <Input
                      id="webhooks-secret"
                      type="password"
                      value={stripeWebhooksSecret}
                      onChange={(e) => setStripeWebhooksSecret(e.target.value)}
                      placeholder="whsec_..."
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Usado para verificar a autenticidade dos webhooks do Stripe
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
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