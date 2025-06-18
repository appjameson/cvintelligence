import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowLeft, CheckCircle, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  description: string;
  features: string[];
}

const creditPackages: CreditPackage[] = [
  {
    id: 'basic',
    name: 'Pacote Básico',
    credits: 5,
    price: 19.90,
    description: 'Ideal para análises pontuais',
    features: [
      '5 análises detalhadas',
      'Relatório completo',
      'Sugestões personalizadas',
      'Válido por 6 meses'
    ]
  },
  {
    id: 'premium',
    name: 'Pacote Premium',
    credits: 15,
    price: 49.90,
    originalPrice: 59.70,
    popular: true,
    description: 'Melhor custo-benefício',
    features: [
      '15 análises detalhadas',
      'Relatório completo',
      'Comparação com mercado',
      'Suporte prioritário',
      'Válido por 12 meses',
      'Economize R$ 9,80'
    ]
  },
  {
    id: 'professional',
    name: 'Pacote Profissional',
    credits: 30,
    price: 89.90,
    originalPrice: 119.40,
    description: 'Para profissionais exigentes',
    features: [
      '30 análises detalhadas',
      'Análise por setor específico',
      'Templates otimizados',
      'Consultoria personalizada',
      'Válido por 12 meses',
      'Economize R$ 29,50'
    ]
  }
];

export default function Checkout() {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
      toast({
        title: "Acesso Negado",
        description: "Você precisa estar logado para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, setLocation, toast]);

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        credits: selectedPackage.credits
      });

      const data = await response.json();
      
      // In a real implementation, you would integrate with Stripe here
      // For now, we'll simulate a successful payment
      toast({
        title: "Pagamento Processado",
        description: `${selectedPackage.credits} créditos adicionados à sua conta!`,
        variant: "default",
      });

      // Redirect to home after successful purchase
      setTimeout(() => {
        setLocation('/');
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Erro no Pagamento",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 apple-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="mr-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Comprar Créditos</h1>
              <p className="text-sm text-slate-600">
                Escolha o pacote ideal para suas necessidades
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="apple-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Seus Créditos Atuais</h3>
                  <p className="text-slate-600">Saldo disponível para análises</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-500">{user?.credits || 0}</div>
                  <p className="text-sm text-slate-600">créditos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Package Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Escolha seu Pacote de Créditos
            </h2>
            <p className="text-xl text-slate-600">
              Invista no seu futuro profissional com nossas análises detalhadas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {creditPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <Card 
                  className={`apple-shadow hover-lift cursor-pointer transition-all duration-300 relative ${
                    selectedPackage?.id === pkg.id 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : pkg.popular 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white'
                  }`}
                  onClick={() => handlePackageSelect(pkg)}
                >
                  {pkg.popular && !selectedPackage && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-yellow-500 text-white">
                        <Star size={14} className="mr-1" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center">
                    <CardTitle className={`text-2xl ${pkg.popular && selectedPackage?.id !== pkg.id ? 'text-white' : 'text-slate-900'}`}>
                      {pkg.name}
                    </CardTitle>
                    <div className="py-4">
                      <div className={`text-4xl font-bold ${pkg.popular && selectedPackage?.id !== pkg.id ? 'text-white' : 'text-slate-900'}`}>
                        R$ {pkg.price.toFixed(2).replace('.', ',')}
                      </div>
                      {pkg.originalPrice && (
                        <div className={`text-lg line-through ${pkg.popular && selectedPackage?.id !== pkg.id ? 'text-white/70' : 'text-slate-500'}`}>
                          R$ {pkg.originalPrice.toFixed(2).replace('.', ',')}
                        </div>
                      )}
                      <div className={`text-lg font-semibold ${pkg.popular && selectedPackage?.id !== pkg.id ? 'text-white' : 'text-blue-500'}`}>
                        {pkg.credits} créditos
                      </div>
                    </div>
                    <p className={`${pkg.popular && selectedPackage?.id !== pkg.id ? 'text-white/90' : 'text-slate-600'}`}>
                      {pkg.description}
                    </p>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {pkg.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle 
                            size={16} 
                            className={`mr-3 ${
                              pkg.popular && selectedPackage?.id !== pkg.id 
                                ? 'text-white' 
                                : 'text-green-500'
                            }`} 
                          />
                          <span className={`text-sm ${
                            pkg.popular && selectedPackage?.id !== pkg.id 
                              ? 'text-white' 
                              : 'text-slate-600'
                          }`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Purchase Summary */}
        {selectedPackage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="apple-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2" size={24} />
                  Resumo da Compra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-600">Pacote selecionado:</span>
                    <span className="font-semibold">{selectedPackage.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-600">Créditos:</span>
                    <span className="font-semibold">{selectedPackage.credits} créditos</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-600">Preço:</span>
                    <span className="font-semibold">R$ {selectedPackage.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  {selectedPackage.originalPrice && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-slate-600">Economia:</span>
                      <span className="font-semibold text-green-600">
                        R$ {(selectedPackage.originalPrice - selectedPackage.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-4 text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-500">R$ {selectedPackage.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  <Button
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl apple-shadow"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Processando...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="mr-2" size={20} />
                        Finalizar Compra
                      </>
                    )}
                  </Button>
                  
                  <p className="text-sm text-slate-500 text-center mt-4">
                    Pagamento seguro processado via Stripe. Seus créditos serão adicionados automaticamente após a confirmação.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
