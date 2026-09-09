import React, { useEffect, useState } from 'react';
import { Sparkles, X, Activity, Smartphone, Flame, Compass } from 'lucide-react';
import { DealScore, api, RecommendationResponse } from '../lib/api';
import { DealCard } from './DealCard';
import { UserSearchIntent } from '../lib/useUserIntent';

interface Props {
  intent: UserSearchIntent;
  onOpenHistory: (deal: DealScore) => void;
  onOpenAlert: (deal: DealScore) => void;
  onDismiss: () => void;
  isFavorite?: (dealIdOrProductId: string) => boolean;
  onToggleFavorite?: (deal: DealScore) => void;
}

export const PersonalizedFeed: React.FC<Props> = ({
  intent,
  onOpenHistory,
  onOpenAlert,
  onDismiss,
  isFavorite,
  onToggleFavorite,
}) => {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .getRecommendations(intent.intent, intent.brand)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setData(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [intent.intent, intent.brand]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 animate-pulse h-32 flex items-center justify-center">
          <span className="text-xs text-stone-600 font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Cargando recomendaciones según tu última búsqueda...
          </span>
        </div>
      </div>
    );
  }

  if (!data || data.deals.length === 0) {
    return null;
  }

  const getIntentIcon = () => {
    switch (intent.intent) {
      case 'RUNNING':
        return <Activity className="w-4 h-4 text-emerald-700" />;
      case 'BASKETBALL':
        return <Flame className="w-4 h-4 text-amber-700" />;
      case 'SMARTPHONES':
        return <Smartphone className="w-4 h-4 text-sky-700" />;
      default:
        return <Compass className="w-4 h-4 text-purple-700" />;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
      <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200/80 text-stone-900 shadow-2xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0">
              {getIntentIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-stone-900">
                  {data.title}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold uppercase border border-amber-300">
                  Para Ti
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">{data.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-amber-100/50 border border-stone-200 px-2.5 py-1 rounded-lg transition-colors self-end sm:self-center"
            title="Descartar recomendaciones"
          >
            <X className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.deals.map((deal) => (
            <DealCard
              key={`rec-${deal.offer.id}`}
              deal={deal}
              onOpenHistory={onOpenHistory}
              onOpenAlert={onOpenAlert}
              isFavorite={isFavorite ? isFavorite(deal.offer.id) : false}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
