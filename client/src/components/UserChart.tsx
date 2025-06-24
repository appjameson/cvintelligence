// client/src/components/UserChart.tsx - VERSÃO COMPARATIVA

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Period = 'day' | 'week' | 'month';

async function fetchUserStats(period: Period) {
  const res = await fetch(`/api/admin/user-stats?period=${period}`);
  if (!res.ok) throw new Error('Falha ao buscar estatísticas');
  return res.json();
}

export default function UserChart() {
  const [period, setPeriod] = useState<Period>('day');

  const { data, isLoading } = useQuery({
    queryKey: ['userStats', period],
    queryFn: () => fetchUserStats(period),
  });

  return (
    <Card className="apple-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="mr-3 text-blue-500" />
            Novos Usuários por Período
          </div>
          <div className="flex space-x-1">
            {(['day', 'week', 'month'] as Period[]).map(p => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className="capitalize"
              >
                {p === 'day' ? 'Dia' : p === 'week' ? 'Semana' : 'Mês'}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] pt-6">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '0.5rem' 
                }}
              />
              <Legend />
              {/* Adicionamos uma barra para o período anterior, mas por enquanto ela tem dados de exemplo */}
              <Bar dataKey="previous" fill="#cbd5e1" name="Período Anterior" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" fill="#3b82f6" name="Período Atual" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}