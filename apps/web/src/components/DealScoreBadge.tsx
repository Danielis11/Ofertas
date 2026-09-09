import React from 'react';
import { Sparkles, TrendingDown, Award } from 'lucide-react';
import { DealScore } from '../lib/api';

interface Props {
  deal: DealScore;
  size?: 'sm' | 'md' | 'lg';
}

export const DealScoreBadge: React.FC<Props> = ({ deal, size = 'md' }) => {
  const { score, grade, savingsPercentage, factors } = deal;

  const getColors = () => {
    switch (grade) {
      case 'SUPER_DEAL':
        return {
          textColor: 'text-emerald-700',
          label: 'Super Deal',
        };
      case 'GREAT_DEAL':
        return {
          textColor: 'text-blue-700',
          label: 'Gran Oferta',
        };
      case 'GOOD_DEAL':
        return {
          textColor: 'text-amber-700',
          label: 'Buena Oferta',
        };
      case 'FAIR':
        return {
          textColor: 'text-slate-600',
          label: 'Precio Regular',
        };
      default:
        return {
          textColor: 'text-rose-700',
          label: 'Precio Alto',
        };
    }
  };

  const colors = getColors();

  return (
    <div className="flex items-center gap-2 group relative">
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${colors.textColor}`}>
        <Award className="w-3.5 h-3.5 shrink-0" />
        <span>Score {score}</span>
        <span className="text-slate-300 font-normal">·</span>
        <span className="text-[11px] font-bold uppercase tracking-wide">
          {colors.label}
        </span>
      </div>

      {/* Tooltip on hover with score factors */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-56 p-2.5 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-30 pointer-events-none">
        <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
          <span>Factores del Deal</span>
          <span className="text-orange-400 font-bold">{score} pts</span>
        </div>
        <div className="space-y-1 text-slate-300 text-[11px]">
          <div className="flex justify-between">
            <span>Vs. Promedio histórico:</span>
            <span className="font-medium text-emerald-400">-{factors.discountFromAverage}%</span>
          </div>
          <div className="flex justify-between">
            <span>Vs. Precio máximo:</span>
            <span className="font-medium text-emerald-400">-{factors.discountFromHistoricalMax}%</span>
          </div>
          {factors.isHistoricalLowest && (
            <div className="text-amber-400 font-semibold flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" /> Mínimo histórico verificado
            </div>
          )}
          {factors.crossStoreAdvantage > 0 && (
            <div className="text-blue-300 font-medium flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> {factors.crossStoreAdvantage}% más barato que otras tiendas
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
