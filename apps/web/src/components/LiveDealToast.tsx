import React from 'react';
import { Flame, X, TrendingDown, Bell } from 'lucide-react';
import { LiveEvent } from '../lib/useLiveDeals';

interface Props {
  event: LiveEvent | null;
  onDismiss: () => void;
}

export const LiveDealToast: React.FC<Props> = ({ event, onDismiss }) => {
  if (!event) return null;

  const isPriceDrop = event.type === 'PRICE_DROPPED';
  const diff = event.oldPrice ? event.oldPrice - event.price : 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-orange-500/40 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/30">
          {isPriceDrop ? <TrendingDown className="w-5 h-5 text-emerald-400" /> : <Flame className="w-5 h-5 text-orange-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
              {isPriceDrop ? '¡Bajada de Precio!' : 'Nuevo Deal'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Ahora mismo</span>
          </div>

          <p className="text-xs font-semibold text-slate-100 line-clamp-1">{event.title}</p>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sm font-bold text-white">${event.price} MXN</span>
            {event.oldPrice && (
              <span className="text-xs text-slate-400 line-through">${event.oldPrice}</span>
            )}
            {diff > 0 && (
              <span className="text-xs font-bold text-emerald-400">-${diff} MXN</span>
            )}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
