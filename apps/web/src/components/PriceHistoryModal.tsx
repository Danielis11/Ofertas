import React, { useEffect, useState } from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  Store as StoreIcon,
} from 'lucide-react';
import { DealScore, PricePoint, PriceStatistics, PricePrediction, Offer, api } from '../lib/api';

interface Props {
  deal: DealScore | null;
  onClose: () => void;
  onOpenAlert: (deal: DealScore) => void;
}

export const PriceHistoryModal: React.FC<Props> = ({ deal, onClose, onOpenAlert }) => {
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [stats, setStats] = useState<PriceStatistics | null>(null);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [otherOffers, setOtherOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deal) return;
    setLoading(true);

    Promise.all([
      api.getPriceHistory(deal.offer.id).catch(() => []),
      api.getPriceStatistics(deal.offer.id).catch(() => null),
      api.getPrediction(deal.offer.id).catch(() => null),
      api.getProductOffers(deal.offer.productId).catch(() => []),
    ]).then(([historyData, statsData, predData, offersData]) => {
      setHistory(historyData);
      setStats(statsData);
      setPrediction(predData);
      setOtherOffers(offersData);
      setLoading(false);
    });
  }, [deal]);


  if (!deal) return null;

  const { offer } = deal;
  const product = offer.product;

  const formatPrice = (val?: number) => {
    if (val === undefined || val === null) return 'N/A';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: offer.currency || 'MXN',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // SVG Chart points calculation
  const chartPoints = history.length > 0 ? history : [{ id: '1', price: Number(offer.price), recordedAt: new Date().toISOString() }];
  const prices = chartPoints.map((p) => Number(p.price));
  const minP = Math.min(...prices) * 0.95;
  const maxP = Math.max(...prices) * 1.05;
  const range = maxP - minP || 1;

  const width = 500;
  const height = 180;
  const padding = 20;

  const coordinates = chartPoints.map((pt, idx) => {
    const x = padding + (idx / Math.max(1, chartPoints.length - 1)) * (width - padding * 2);
    const y = height - padding - ((Number(pt.price) - minP) / range) * (height - padding * 2);
    return { x, y, price: Number(pt.price), date: new Date(pt.recordedAt).toLocaleDateString('es-MX') };
  });

  const pathD = coordinates.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-700">
              {offer.store?.name}
            </span>
            {product?.brand && <span className="text-xs text-slate-400 font-medium">{product.brand}</span>}
          </div>
          <h2 className="text-lg font-bold text-slate-900 line-clamp-1">{product?.name}</h2>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-black text-slate-900">{formatPrice(Number(offer.price))}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Deal Score: {deal.score}/100 ({deal.grade.replace('_', ' ')})
            </span>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-4 gap-3 my-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Mínimo Histórico</span>
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowDownRight className="w-4 h-4" />
              {formatPrice(stats?.minPrice || Number(offer.price))}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Precio Promedio</span>
            <span className="text-sm font-bold text-slate-700 block mt-0.5">
              {formatPrice(stats?.avgPrice || Number(offer.price))}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Precio Máximo</span>
            <span className="text-sm font-bold text-rose-500 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-4 h-4" />
              {formatPrice(stats?.maxPrice || Number(offer.price))}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Bajadas Registradas</span>
            <span className="text-sm font-bold text-orange-600 block mt-0.5">
              {stats?.priceDropsCount ?? 1} veces
            </span>
          </div>
        </div>

        {/* Price History Chart */}
        <div className="my-4 bg-slate-950 rounded-2xl p-4 text-white">
          <div className="flex justify-between items-center mb-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-orange-400" />
              <span>Fluctuación Histórica de Precios</span>
            </div>
            <span className="text-[11px] text-slate-400">{chartPoints.length} puntos de datos</span>
          </div>

          {loading ? (
            <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
              Cargando historial...
            </div>
          ) : (
            <div className="relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
                {/* Horizontal Guide lines */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="3 3" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeDasharray="3 3" />

                {/* Line Path */}
                <path d={pathD} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Points */}
                {coordinates.map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
                ))}
              </svg>

              <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-2">
                <span>{coordinates[0]?.date || 'Inicio'}</span>
                <span>{coordinates[coordinates.length - 1]?.date || 'Hoy'}</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Deal Intelligence & Anti-Fraud Audit */}
        {prediction && (
          <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400">
                <Sparkles className="w-4 h-4" />
                <span>DealHunter AI Engine™</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 font-mono">
                Confianza {prediction.confidenceScore}%
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {prediction.recommendation === 'BUY_NOW' && (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> ¡COMPRA AHORA!
                </span>
              )}
              {prediction.recommendation === 'WAIT' && (
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> ESPERA (BAJADA PREVISTA)
                </span>
              )}
              {prediction.recommendation === 'OVERPRICED' && (
                <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> SOBREPRECIO DETECTADO
                </span>
              )}
              {prediction.recommendation === 'FAIR_PRICE' && (
                <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-black flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5" /> PRECIO ESTABLE
                </span>
              )}

              <span className="text-xs text-slate-300">
                Proyección: <strong className="text-white">{formatPrice(prediction.predictedNextPrice)}</strong>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {prediction.recommendationReason}
            </p>

            {/* Fake Discount Verification Alert */}
            {prediction.fakeDiscountAnalysis && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                  prediction.fakeDiscountAnalysis.confidence === 'SUSPECTED_INFLATION'
                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                }`}
              >
                {prediction.fakeDiscountAnalysis.confidence === 'SUSPECTED_INFLATION' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block">
                    {prediction.fakeDiscountAnalysis.confidence === 'SUSPECTED_INFLATION'
                      ? '⚠️ Alerta de Oferta Engañosa (Inflación Artificial)'
                      : '✓ Auditoría de Autenticidad Aprobada'}
                  </span>
                  <span className="text-[11px] opacity-90 block mt-0.5">
                    {prediction.fakeDiscountAnalysis.explanation}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cross-Store Multi-Vendor Price Comparison */}
        {otherOffers.length > 1 && (
          <div className="my-4 bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <StoreIcon className="w-4 h-4 text-orange-600" />
                <span>Comparativa de Precios en Tiendas Oficiales ({otherOffers.length} tiendas)</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Precios en tiempo real
              </span>
            </div>

            <div className="space-y-2">
              {otherOffers.map((off, idx) => {
                const isCurrent = off.id === offer.id;
                const isCheapest = idx === 0;
                const diff = Number(off.price) - Number(otherOffers[0].price);

                return (
                  <div
                    key={off.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCheapest
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                        : isCurrent
                        ? 'bg-orange-50/50 border-orange-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {off.store?.logo ? (
                        <img
                          src={off.store.logo}
                          alt={off.store.name}
                          className="w-8 h-8 object-contain bg-white rounded-md p-1 border border-slate-100"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {off.store?.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {off.store?.name || 'Tienda'}
                          </span>
                          {isCheapest && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                              🏆 Mejor Precio
                            </span>
                          )}
                          {isCurrent && !isCheapest && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-semibold">
                              Viendo ahora
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {isCheapest
                            ? 'La opción más económica hoy'
                            : `+${formatPrice(diff)} vs ${otherOffers[0].store?.name}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900">
                        {formatPrice(Number(off.price))}
                      </span>
                      <a
                        href={off.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isCheapest
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span>Ver tienda</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Verificado algorítmicamente por DealHunter Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAlert(deal)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Bell className="w-4 h-4" />
              <span>Crear Alerta de Precio</span>
            </button>

            <a
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 transition-colors shadow-sm"
            >
              Ir a Oferta
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
