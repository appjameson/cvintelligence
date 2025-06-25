import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, CreditCard, Shield } from "lucide-react";

interface Configuration {
  id: number;
  key: string;
  value: string;
  description: string;
  category: string;
  isActive: boolean;
}

export default function AdminConfigurations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("authentication");

  const { data: configurations = [], isLoading } = useQuery({
    queryKey: ["/api/admin/configurations"],
    retry: false,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("PUT", `/api/admin/configurations/${key}`, { value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/configurations"] });
      toast({
        title: "Configuração atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro ao atualizar configuração",
        variant: "destructive",
      });
    },
  });

  const getConfigValue = (key: string) => {
    const config = (configurations as Configuration[])?.find((c: Configuration) => c.key === key);
    return config?.value || "";
  };

  const isConfigEnabled = (key: string) => {
    return getConfigValue(key) === "true";
  };

  const handleToggle = (key: string, enabled: boolean) => {
    updateConfigMutation.mutate({ key, value: enabled ? "true" : "false" });
  };

  const handleInputChange = (key: string, value: string) => {
    updateConfigMutation.mutate({ key, value });
  };

  const authConfigs = (configurations as Configuration[])?.filter((c: Configuration) => c.category === "authentication") || [];
  const paymentConfigs = (configurations as Configuration[])?.filter((c: Configuration) => c.category === "payments") || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-600 mt-2">
          Gerencie as configurações de autenticação e pagamentos da aplicação
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="authentication" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Autenticação
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="authentication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configurações de Autenticação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Login Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Login com Google</Label>
                    <p className="text-sm text-gray-600">
                      Permitir que usuários façam login usando conta Google
                    </p>
                  </div>
                  <Switch
                    checked={isConfigEnabled("GOOGLE_LOGIN_ENABLED")}
                    onCheckedChange={(checked) => handleToggle("GOOGLE_LOGIN_ENABLED", checked)}
                  />
                </div>

                {isConfigEnabled("GOOGLE_LOGIN_ENABLED") && (
                  <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                    <div>
                      <Label htmlFor="google-client-id">Google Client ID</Label>
                      <Input
                        id="google-client-id"
                        type="text"
                        placeholder="Digite o Google OAuth Client ID"
                        value={getConfigValue("GOOGLE_CLIENT_ID")}
                        onChange={(e) => handleInputChange("GOOGLE_CLIENT_ID", e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Obtenha no Google Cloud Console
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="google-client-secret">Google Client Secret</Label>
                      <Input
                        id="google-client-secret"
                        type="password"
                        placeholder="Digite o Google OAuth Client Secret"
                        value={getConfigValue("GOOGLE_CLIENT_SECRET")}
                        onChange={(e) => handleInputChange("GOOGLE_CLIENT_SECRET", e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Mantenha este valor em segredo
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Configurações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stripe Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Pagamentos com Stripe</Label>
                    <p className="text-sm text-gray-600">
                      Habilitar sistema de pagamentos integrado com Stripe
                    </p>
                  </div>
                  <Switch
                    checked={isConfigEnabled("STRIPE_PAYMENTS_ENABLED")}
                    onCheckedChange={(checked) => handleToggle("STRIPE_PAYMENTS_ENABLED", checked)}
                  />
                </div>

                {isConfigEnabled("STRIPE_PAYMENTS_ENABLED") && (
                  <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                    <div>
                      <Label htmlFor="stripe-secret-key">Chave Secreta do Stripe</Label>
                      <Input
                        id="stripe-secret-key"
                        type="password"
                        placeholder="sk_..."
                        value={getConfigValue("STRIPE_SECRET_KEY")}
                        onChange={(e) => handleInputChange("STRIPE_SECRET_KEY", e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Chave secreta do Stripe (nunca compartilhe)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="stripe-public-key">Chave Pública do Stripe</Label>
                      <Input
                        id="stripe-public-key"
                        type="text"
                        placeholder="pk_..."
                        value={getConfigValue("VITE_STRIPE_PUBLIC_KEY")}
                        onChange={(e) => handleInputChange("VITE_STRIPE_PUBLIC_KEY", e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Chave pública do Stripe
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="stripe-webhook-secret">Stripe Webhook Secret</Label>
                      <Input
                        id="stripe-webhook-secret"
                        type="password"
                        placeholder="whsec_..."
                        value={getConfigValue("STRIPE_WEBHOOK_SECRET")}
                        onChange={(e) => handleInputChange("STRIPE_WEBHOOK_SECRET", e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Secret para validar webhooks do Stripe
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="stripe-price-id">ID do Preço (Compra Única)</Label>
                      <Input
                        id="stripe-price-id"
                        type="text"
                        placeholder="price_..."
                        value={getConfigValue("STRIPE_PRICE_ID")}
                        onChange={(e) => handleInputChange("STRIPE_PRICE_ID", e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ID do preço no Stripe para compras únicas
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="stripe-subscription-price-id">ID do Preço (Assinatura)</Label>
                      <Input
                        id="stripe-subscription-price-id"
                        type="text"
                        placeholder="price_..."
                        value={getConfigValue("STRIPE_SUBSCRIPTION_PRICE_ID")}
                        onChange={(e) => handleInputChange("STRIPE_SUBSCRIPTION_PRICE_ID", e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ID do preço no Stripe para assinaturas
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}