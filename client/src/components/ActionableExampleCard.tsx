// client/src/components/ActionableExampleCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface ActionableExampleCardProps {
  example: {
    before: string;
    after: string;
    explanation: string;
  };
}

export default function ActionableExampleCard({ example }: ActionableExampleCardProps) {
  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800">Exemplo Prático de Melhoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-red-600 mb-1">Antes:</h4>
          <p className="text-sm text-slate-600 p-3 bg-red-50 border border-red-200 rounded-md">
            "{example.before}"
          </p>
        </div>
        
        <div className="flex justify-center">
          <ArrowRight className="text-slate-400" />
        </div>

        <div>
          <h4 className="font-semibold text-green-600 mb-1">Depois:</h4>
          <p className="text-sm text-slate-800 p-3 bg-green-50 border border-green-200 rounded-md">
            "{example.after}"
          </p>
        </div>

        <div className="pt-2">
          <h4 className="font-semibold text-blue-600 mb-1">Por que funciona melhor?</h4>
          <p className="text-sm text-slate-700">{example.explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}