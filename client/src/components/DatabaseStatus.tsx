// client/src/components/DatabaseStatus.tsx - VERSÃO CORRIGIDA

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

async function fetchDbStatus() {
  const res = await fetch('/api/admin/db-status');
  const data = await res.json();
  if (!res.ok) {
    // Se a resposta não for OK, joga um erro com a mensagem do backend
    throw new Error(data.message || 'Falha na conexão com o servidor');
  }
  return data;
}

export default function DatabaseStatus() {
  const { data, error, status } = useQuery({
    queryKey: ['dbStatus'],
    queryFn: fetchDbStatus,
    refetchInterval: 60000,
    retry: 1, 
  });

  const isLoading = status === 'pending';
  const isError = status === 'error';

  const statusText = isLoading ? "Verificando..." : isError ? "Erro" : "Operacional";
  const statusMessage = isLoading 
    ? "Verificando conexão..." 
    : isError 
    ? (error as Error).message 
    : data?.message;

  const badgeVariant = isError ? "destructive" : "default";
  const badgeClass = !isError && !isLoading ? "bg-green-100 text-green-800" : "";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={badgeVariant} className={badgeClass}>
            {!isLoading && (
              <div className={`h-2 w-2 rounded-full mr-2 animate-pulse ${isError ? 'bg-white' : 'bg-green-500'}`}></div>
            )}
            {statusText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}