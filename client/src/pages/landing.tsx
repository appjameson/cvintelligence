import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Upload, Lightbulb, Rocket, CheckCircle, Star, Award, Users } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

export default function Landing() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Brain className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-slate-900">CVAnalyzer</span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-500 transition-colors duration-300">
                Recursos
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-500 transition-colors duration-300">
                Preços
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-blue-500 transition-colors duration-300">
                Como Funciona
              </a>
              <Button 
                onClick={() => setShowLoginModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full apple-shadow"
              >
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center">
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Transforme seu <span className="text-blue-500">Currículo</span><br />
                com Inteligência Artificial
              </motion.h1>
              
              <motion.p 
                className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Descubra como melhorar seu currículo com análises detalhadas e sugestões personalizadas.
                Nossa IA identifica pontos fortes e oportunidades de melhoria em segundos.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button
                  onClick={() => setShowUploadModal(true)}
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold apple-shadow-lg hover-lift"
                >
                  <Upload className="mr-2" size={20} />
                  Analisar Currículo Grátis
                </Button>
                
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-blue-500 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-blue-50"
                >
                  <Star className="mr-2" size={20} />
                  Ver Como Funciona
                </Button>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Floating CV Preview */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="relative animate-float"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <Card className="bg-white rounded-3xl p-8 apple-shadow-lg mx-auto max-w-2xl">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
                <div>
                  <div className="h-4 bg-slate-200 rounded-full w-32 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded-full w-24"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-3 bg-slate-200 rounded-full w-full"></div>
                <div className="h-3 bg-slate-200 rounded-full w-4/5"></div>
                <div className="h-3 bg-slate-200 rounded-full w-3/4"></div>
              </div>
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center animate-bounce-subtle">
                <CheckCircle size={16} />
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
                Por que escolher o CVAnalyzer?
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Nossa inteligência artificial avalia cada aspecto do seu currículo,
                oferecendo insights precisos para maximizar suas chances de sucesso.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Análise Inteligente",
                description: "IA avançada que analisa estrutura, conteúdo, palavras-chave e adequação às vagas desejadas.",
                color: "bg-blue-50 text-blue-500"
              },
              {
                icon: Lightbulb,
                title: "Sugestões Personalizadas",
                description: "Receba dicas específicas e acionáveis para melhorar cada seção do seu currículo.",
                color: "bg-green-50 text-green-500"
              },
              {
                icon: Rocket,
                title: "Resultados Rápidos",
                description: "Análise completa em menos de 30 segundos. Otimize seu currículo instantaneamente.",
                color: "bg-purple-50 text-purple-500"
              }
            ].map((feature, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <Card className="bg-white rounded-3xl p-8 apple-shadow hover-lift">
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <feature.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
                Como Funciona
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Em apenas 3 passos simples, você terá um currículo otimizado e pronto para conquistar sua vaga dos sonhos.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {[
              {
                step: 1,
                title: "Upload do Currículo",
                description: "Faça upload do seu currículo em PDF ou Word. Processo seguro e confidencial.",
                color: "bg-blue-500"
              },
              {
                step: 2,
                title: "Análise por IA",
                description: "Nossa IA analisa cada aspecto: formato, conteúdo, palavras-chave e estrutura.",
                color: "bg-green-500"
              },
              {
                step: 3,
                title: "Receba Insights",
                description: "Relatório detalhado com pontuação, sugestões específicas e melhorias recomendadas.",
                color: "bg-purple-500"
              }
            ].map((step, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="text-center">
                  <div className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 apple-shadow-lg`}>
                    <span className="text-white text-2xl font-bold">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
                Planos Flexíveis
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Comece gratuitamente e desbloqueie todo o potencial com nossos planos premium.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Gratuito",
                price: "R$ 0",
                period: "Para começar",
                features: [
                  "2 análises gratuitas",
                  "Relatório básico",
                  "Sugestões essenciais"
                ],
                buttonText: "Começar Grátis",
                buttonAction: () => setShowUploadModal(true),
                popular: false
              },
              {
                name: "Premium",
                price: "R$ 19,90",
                period: "10 análises",
                features: [
                  "10 análises detalhadas",
                  "Relatório completo",
                  "Comparação com mercado",
                  "Suporte prioritário"
                ],
                buttonText: "Escolher Premium",
                buttonAction: () => setShowLoginModal(true),
                popular: true
              },
              {
                name: "Profissional",
                price: "R$ 49,90",
                period: "Análises ilimitadas",
                features: [
                  "Análises ilimitadas",
                  "Análise por setor",
                  "Templates otimizados",
                  "Consultoria personalizada"
                ],
                buttonText: "Escolher Pro",
                buttonAction: () => setShowLoginModal(true),
                popular: false
              }
            ].map((plan, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <Card className={`rounded-3xl p-8 apple-shadow hover-lift relative ${
                  plan.popular ? 'bg-blue-500 text-white' : 'bg-white'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <h3 className={`text-2xl font-bold mb-4 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <div className={`text-4xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                      {plan.price}
                    </div>
                    <div className={plan.popular ? 'text-white/80' : 'text-slate-600'}>
                      {plan.period}
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle 
                          className={`mr-3 ${plan.popular ? 'text-white' : 'text-green-500'}`} 
                          size={16} 
                        />
                        <span className={plan.popular ? 'text-white' : 'text-slate-600'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={plan.buttonAction}
                    className={`w-full py-3 rounded-2xl font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-white text-blue-500 hover:bg-gray-50'
                        : index === 2
                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-bg">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Pronto para turbinar seu currículo?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de profissionais que já melhoraram seus currículos com nossa IA. Comece hoje mesmo!
            </p>
            <Button
              onClick={() => setShowUploadModal(true)}
              size="lg"
              className="bg-white text-blue-500 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-50 apple-shadow-lg hover-lift"
            >
              <Upload className="mr-2" size={20} />
              Analisar Meu Currículo Agora
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Brain className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold">CVAnalyzer</span>
              </div>
              <p className="text-white/70 mb-4 max-w-md">
                Transforme seu currículo com inteligência artificial e conquiste a vaga dos seus sonhos.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-white/70 hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="text-white/70 hover:text-white transition-colors">Preços</a></li>
                <li><a href="#how-it-works" className="text-white/70 hover:text-white transition-colors">Como Funciona</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Ajuda</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="text-white/70 hover:text-white transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-12 pt-8 text-center">
            <p className="text-white/70">&copy; 2024 CVAnalyzer. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}
