import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Briefcase, Info } from "lucide-react";

interface ExtractedData {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  recentExperience?: string;
}

interface ResumeHighlightsCardProps {
  data?: ExtractedData;
}

export default function ResumeHighlightsCard({ data }: ResumeHighlightsCardProps) {
  if (!data) {
    return (
      <Card className="apple-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-500">
            <Info className="mr-3" />
            Resumo Extraído pela IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Não foi possível extrair os dados de resumo do documento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="apple-shadow">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800">
          <Info className="mr-3 text-blue-500" />
          Resumo Extraído pela IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center text-slate-800">
          <User size={16} className="mr-3 flex-shrink-0 text-slate-500" />
          <strong>Nome:</strong><span className="ml-2 text-slate-600">{data.name || 'Não identificado'}</span>
        </div>

        <div>
          <p className="font-semibold text-slate-800 mb-1 flex items-center">
            <Briefcase size={16} className="mr-3 flex-shrink-0 text-slate-500" />
            Resumo Profissional Identificado:
          </p>
          <p className="text-slate-600 border-l-2 border-blue-500 pl-4 ml-2 py-1 italic">
            {data.summary || 'Não identificado'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}