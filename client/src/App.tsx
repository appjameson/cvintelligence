import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Analysis from "@/pages/analysis";
import Checkout from "@/pages/checkout";
import AuthPage from "@/pages/auth";
import AdminPage from "./pages/admin";
import AdminLayout from "./layouts/AdminLayout";


function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // ... (código de loading) ...

  return (
    <Switch>
      {/* Rotas para usuários não autenticados */}
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
        </>
      ) : (
        <>
          {/* Rotas para usuários autenticados */}
          <Route path="/" component={Home} />
          <Route path="/analysis/:id" component={Analysis} />
          <Route path="/checkout" component={Checkout} />

          {/* Rota para a área de Admin, agora usando o Layout */}
          <Route path="/admin">
            <AdminLayout>
              <AdminPage />
            </AdminLayout>
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
