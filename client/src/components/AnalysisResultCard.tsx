// client/src/components/AnalysisResultCard.tsx

import React from 'react';

// Tipos para os dados que o card espera receber (props)
interface ScoreItem {
  title: string;
  description: string;
  score: string;
  icon: 'check' | 'exclamation';
}

interface CardData {
  userName: string;
  userTitle: string;
  userContact: string;
  overallScore: string;
  suggestion: string;
  scoreItems: ScoreItem[];
}

interface AnalysisResultCardProps {
  data: CardData;
}

export default function AnalysisResultCard({ data }: AnalysisResultCardProps) {
  const getStatusClasses = (icon: 'check' | 'exclamation') => {
    if (icon === 'check') {
      return {
        bgColor: 'bg-green-500',
        textColor: 'text-green-500',
      };
    }
    return {
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-500',
    };
  };

  return (
    <div className="cv-example rounded-3xl p-8 shadow-2xl hover-glow relative overflow-hidden max-w-2xl mx-auto">
      {/* Cabeçalho do CV */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-gray-600 text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{data.userName}</h3>
            <p className="text-gray-600">{data.userTitle}</p>
            <p className="text-sm text-gray-500">{data.userContact}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{data.overallScore}</div>
          <p className="text-sm text-gray-600">Pontuação Geral</p>
        </div>
      </div>

      {/* Seções com Pontuações */}
      <div className="space-y-4">
        {data.scoreItems.map((item, index) => {
          const statusClasses = getStatusClasses(item.icon);
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${statusClasses.bgColor} rounded-lg flex items-center justify-center`}>
                  <i className={`fas fa-${item.icon} text-white text-sm`}></i>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <div className={`${statusClasses.textColor} font-bold`}>{item.score}</div>
            </div>
          );
        })}
      </div>

      {/* Pop-up de Sugestão de IA */}
      <div className="absolute -top-2 -right-2 glass-dark rounded-xl p-3 border border-yellow-500/50 animate-pulse-glow">
        <div className="flex items-center space-x-2">
          <i className="fas fa-lightbulb text-yellow-400"></i>
          <p className="text-xs text-white">Sugestão de Melhoria</p>
        </div>
        <p className="text-xs text-gray-300 mt-1">{data.suggestion}</p>
      </div>
    </div>
  );
}