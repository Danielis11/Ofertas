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
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
          badge: 'bg-emerald-600 text-white',
          circle: '#059669',
        };
      case 'GREAT_DEAL':
        return {
          bg: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
          badge: 'bg-blue-600 text-white',
          circle: '#2563eb',
        };
      case 'GOOD_DEAL':
        return {
          bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
          badge: 'bg-amber-600 text-white',
          circle: '#d97706',
        };
      case 'FAIR':
        return {
          bg: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
          badge: 'bg-slate-600 text-white',
          circle: '#475569',
        };
      default:
        return {
          bg: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
          badge: 'bg-rose-600 text-white',
          circle: '#e11d48',
        };
    }
  };

  const colors = getColors();

  return (
    <div className="flex items-center gap-2 group relative">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold text-xs transition-all shadow-sm ${colors.bg}`}
      >
        <Award className="w-3.5 h-3.5" />
        <span>Score {score}/100</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${colors.badge}`}>
          {grade.replace('_', ' ')}
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
              <Sparkles className="w-3 h-3" /> ¡Mínimo Histórico Absoluto!
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
