import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, History } from "lucide-react";

interface ComparativeFeedback {
  improvementsMade: string[];
  pointsToStillImprove: string[];
}

interface ComparativeFeedbackCardProps {
  data: ComparativeFeedback;
}

export default function ComparativeFeedbackCard({ data }: ComparativeFeedbackCardProps) {
  return (
    <Card className="apple-shadow">
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="mr-3 text-purple-500" />
          Progresso da Análise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-green-600 mb-2">Melhorias Realizadas</h4>
          {data.improvementsMade.length > 0 ? (
            <ul className="space-y-2">
              {data.improvementsMade.map((item, index) => (
                <li key={index} className="flex items-start text-sm text-slate-700">
                  <CheckCircle size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">Nenhuma melhoria das sugestões anteriores foi detectada.</p>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-red-600 mb-2">Pontos que Ainda Precisam de Atenção</h4>
          {data.pointsToStillImprove.length > 0 ? (
            <ul className="space-y-2">
              {data.pointsToStillImprove.map((item, index) => (
                <li key={index} className="flex items-start text-sm text-slate-700">
                  <AlertCircle size={16} className="mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">Ótimo! Parece que você abordou todas as sugestões anteriores.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}