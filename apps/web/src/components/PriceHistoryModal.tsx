import React, { useEffect, useState } from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  ShieldCheck,
  ShieldAlert,
  Bell,
  ExternalLink,
  Store as StoreIcon,
  Award,
  Calendar,
  Heart,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { DealScore, PricePoint, PriceStatistics, PricePrediction, Offer, api } from '../lib/api';

interface Props {
  deal: DealScore | null;
  onClose: () => void;
  onOpenAlert: (deal: DealScore) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (deal: DealScore) => void;
}

export const PriceHistoryModal: React.FC<Props> = ({
  deal,
  onClose,
  onOpenAlert,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [stats, setStats] = useState<PriceStatistics | null>(null);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [otherOffers, setOtherOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);

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

  // SVG Chart calculation on clean white/slate canvas
  const chartPoints =
    history.length > 0
      ? history
      : [{ id: '1', price: Number(offer.price), recordedAt: new Date().toISOString() }];

  const prices = chartPoints.map((p) => Number(p.price));
  const actualMin = Math.min(...prices);
  const actualMax = Math.max(...prices);
  const actualAvg = stats?.avgPrice || prices.reduce((a, b) => a + b, 0) / prices.length;
  const spread = actualMax - actualMin || actualMax * 0.1 || 10;
  const minP = Math.max(0, actualMin - spread * 0.15);
  const maxP = actualMax + spread * 0.15;
  const range = maxP - minP || 1;

  const width = 560;
  const height = 160;
  const paddingLeft = 15;
  const paddingRight = 65;
  const paddingTop = 25;
  const paddingBottom = 25;

  const coordinates = chartPoints.map((pt, idx) => {
    const x =
      chartPoints.length === 1
        ? (width - paddingRight) / 2
        : paddingLeft + (idx / (chartPoints.length - 1)) * (width - paddingLeft - paddingRight);
    const y =
      height -
      paddingBottom -
      ((Number(pt.price) - minP) / range) * (height - paddingTop - paddingBottom);
    return {
      x,
      y,
      price: Number(pt.price),
      date: new Date(pt.recordedAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
      }),
    };
  });

  const pathD = coordinates.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
    '',
  );

  const areaD = coordinates.length > 1
    ? `${pathD} L ${coordinates[coordinates.length - 1].x.toFixed(1)} ${height - paddingBottom} L ${coordinates[0].x.toFixed(1)} ${height - paddingBottom} Z`
    : '';

  let minIdx = 0;
  let maxIdx = 0;
  coordinates.forEach((pt, i) => {
    if (pt.price < coordinates[minIdx].price) minIdx = i;
    if (pt.price > coordinates[maxIdx].price) maxIdx = i;
  });

  const yForPrice = (p: number) =>
    height - paddingBottom - ((p - minP) / range) * (height - paddingTop - paddingBottom);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || coordinates.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    let closestIdx = 0;
    let minDiff = Infinity;
    coordinates.forEach((pt, i) => {
      const d = Math.abs(pt.x - mouseX);
      if (d < minDiff) {
        minDiff = d;
        closestIdx = i;
      }
    });
    setHoveredIndex(closestIdx);
  };

  const currentPrice = Number(offer.price);
  const minRecorded = stats?.minPrice ?? (prices.length > 0 ? Math.min(...prices) : currentPrice);
  const maxRecorded = stats?.maxPrice ?? (prices.length > 0 ? Math.max(...prices) : currentPrice);
  const avgRecorded = stats?.avgPrice ?? (prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : currentPrice);

  const isRecordLow = currentPrice <= minRecorded;
  const isNearRecordLow = !isRecordLow && currentPrice <= minRecorded * 1.05;
  const isBelowAvg = currentPrice < avgRecorded;
  const savingsVsMax = Math.max(0, maxRecorded - currentPrice);
  const savingsPctVsMax = maxRecorded > 0 ? Math.round((savingsVsMax / maxRecorded) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 relative max-h-[90vh] overflow-y-auto space-y-5">
        {/* Top actions: Favorite & Close */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(deal)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-500'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-slate-50'
              }`}
              title={isFavorite ? 'Quitar de Me Gusta' : 'Guardar en Me Gusta'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product & Store Header */}
        <div className="space-y-1.5 pr-16">
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-700">
            <span className="font-bold text-slate-900">
              {offer.store?.name || 'Tienda'}
            </span>
            {offer.isOfficialStore && (
              <span className="font-medium text-emerald-700">
                · Tienda oficial
              </span>
            )}
            {product?.brand && (
              <span className="text-slate-400 font-medium">
                · {product.brand}
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2">
            {product?.name || 'Historial de precio'}
          </h2>
          <div className="flex items-baseline gap-3 pt-1">
            <span className="text-2xl font-black text-slate-900">
              {formatPrice(Number(offer.price))}
            </span>
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>Score {deal.score} · {deal.grade.replace('_', ' ')}</span>
            </span>
          </div>
        </div>

        {/* Recorrido Completo del Precio & Diagnóstico de Compra */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-900">Recorrido del Precio</span>
            </div>

            {/* Smart Diagnosis Badge */}
            {isRecordLow ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Mínimo Histórico Absoluto
              </span>
            ) : isNearRecordLow ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                Momento Óptimo para Comprar
              </span>
            ) : isBelowAvg ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
                Por debajo del promedio
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <Minus className="w-3.5 h-3.5 text-slate-400" />
                Precio habitual de mercado
              </span>
            )}
          </div>

          {/* Visual Journey Milestones */}
          <div className="relative pt-2 pb-1">
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Milestone 1: Max */}
              <div className="space-y-1 p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                  Máximo
                </span>
                <span className="text-xs font-bold text-slate-600 block">
                  {formatPrice(maxRecorded)}
                </span>
              </div>

              {/* Milestone 2: Average */}
              <div className="space-y-1 p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                  Promedio
                </span>
                <span className="text-xs font-bold text-slate-700 block">
                  {formatPrice(avgRecorded)}
                </span>
              </div>

              {/* Milestone 3: Record Low */}
              <div className="space-y-1 p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-emerald-700 block tracking-wider">
                  Récord Mínimo
                </span>
                <span className="text-xs font-bold text-emerald-700 block">
                  {formatPrice(minRecorded)}
                </span>
              </div>

              {/* Milestone 4: Current */}
              <div className="space-y-1 p-2 bg-white rounded-lg border border-slate-900/20 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-900 block tracking-wider">
                  Actual
                </span>
                <span className="text-xs font-black text-slate-900 block">
                  {formatPrice(currentPrice)}
                </span>
              </div>
            </div>

            {/* Savings Callout */}
            {savingsPctVsMax > 0 && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium">
                  Ahorras <strong className="font-bold">{formatPrice(savingsVsMax)}</strong> respecto a su precio máximo registrado.
                </span>
                <span className="text-xs font-bold text-emerald-700 shrink-0">
                  -{savingsPctVsMax}% de rebaja
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Minimalist Price Trend Chart (Light canvas, solid lines, clean data points) */}
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Evolución del Precio en el Tiempo</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {coordinates.length} {coordinates.length === 1 ? 'registro' : 'registros históricos'}
            </span>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-xs font-medium">
              Cargando historial de precios...
            </div>
          ) : (
            <div className="w-full relative select-none">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-44 cursor-crosshair overflow-visible"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <defs>
                  <linearGradient id="priceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Reference Guideline: Maximum */}
                <line
                  x1={paddingLeft}
                  y1={yForPrice(actualMax)}
                  x2={width - paddingRight}
                  y2={yForPrice(actualMax)}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - paddingRight + 6}
                  y={yForPrice(actualMax) + 3}
                  className="text-[10px] font-medium fill-slate-400"
                >
                  {formatPrice(actualMax)}
                </text>

                {/* Reference Guideline: Average */}
                {actualMax !== actualMin && (
                  <>
                    <line
                      x1={paddingLeft}
                      y1={yForPrice(actualAvg)}
                      x2={width - paddingRight}
                      y2={yForPrice(actualAvg)}
                      stroke="#e2e8f0"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                    <text
                      x={width - paddingRight + 6}
                      y={yForPrice(actualAvg) + 3}
                      className="text-[9px] font-medium fill-slate-400"
                    >
                      Prom: {formatPrice(actualAvg)}
                    </text>
                  </>
                )}

                {/* Reference Guideline: Minimum */}
                <line
                  x1={paddingLeft}
                  y1={yForPrice(actualMin)}
                  x2={width - paddingRight}
                  y2={yForPrice(actualMin)}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - paddingRight + 6}
                  y={yForPrice(actualMin) + 3}
                  className="text-[10px] font-bold fill-emerald-600"
                >
                  {formatPrice(actualMin)}
                </text>

                {/* Shaded Area under Curve */}
                {areaD && (
                  <path
                    d={areaD}
                    fill="url(#priceAreaGrad)"
                  />
                )}

                {/* Trend Stroke Line */}
                {coordinates.length > 1 && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Clean Key Points (Start, Min, Current) without Clutter */}
                {/* Initial Point */}
                <circle
                  cx={coordinates[0].x}
                  cy={coordinates[0].y}
                  r="3.5"
                  fill="#64748b"
                />

                {/* Minimum Point (highlighted if different from start and end) */}
                {minIdx !== 0 && minIdx !== coordinates.length - 1 && (
                  <circle
                    cx={coordinates[minIdx].x}
                    cy={coordinates[minIdx].y}
                    r="4"
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}

                {/* Current / Last Point */}
                <circle
                  cx={coordinates[coordinates.length - 1].x}
                  cy={coordinates[coordinates.length - 1].y}
                  r="4.5"
                  fill="#0f172a"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Interactive Crosshair & Tooltip on Hover */}
                {hoveredIndex !== null && coordinates[hoveredIndex] && (
                  <g pointerEvents="none">
                    {/* Vertical indicator line */}
                    <line
                      x1={coordinates[hoveredIndex].x}
                      y1={paddingTop}
                      x2={coordinates[hoveredIndex].x}
                      y2={height - paddingBottom}
                      stroke="#475569"
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                    />

                    {/* Active point circle */}
                    <circle
                      cx={coordinates[hoveredIndex].x}
                      cy={coordinates[hoveredIndex].y}
                      r="6"
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />

                    {/* Floating Tooltip Box */}
                    <g
                      transform={`translate(${Math.max(
                        65,
                        Math.min(width - paddingRight - 65, coordinates[hoveredIndex].x),
                      )}, ${Math.max(22, coordinates[hoveredIndex].y - 14)})`}
                    >
                      <rect
                        x="-60"
                        y="-22"
                        width="120"
                        height="24"
                        rx="6"
                        fill="#0f172a"
                        className="shadow-md"
                      />
                      <text
                        x="0"
                        y="-6"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {formatPrice(coordinates[hoveredIndex].price)} · {coordinates[hoveredIndex].date}
                      </text>
                    </g>
                  </g>
                )}
              </svg>

              {/* X-axis date labels */}
              <div className="flex justify-between text-[11px] font-medium text-slate-500 mt-1 px-3">
                <span>{coordinates[0]?.date || 'Inicio'}</span>
                {coordinates.length > 2 && (
                  <span>{coordinates[Math.floor(coordinates.length / 2)]?.date}</span>
                )}
                <span>{coordinates[coordinates.length - 1]?.date || 'Hoy'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Clear & Precise Authenticity Audit (Clean neutral card, zero neon) */}
        {prediction && (
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                {prediction.fakeDiscountAnalysis?.confidence === 'SUSPECTED_INFLATION' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                )}
                <span>
                  {prediction.fakeDiscountAnalysis?.confidence === 'SUSPECTED_INFLATION'
                    ? 'Atención: Posible oferta inflada'
                    : 'Auditoría de autenticidad aprobada'}
                </span>
              </div>

              {prediction.recommendation === 'BUY_NOW' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                  Buen momento de compra
                </span>
              )}
              {prediction.recommendation === 'WAIT' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                  <Minus className="w-3.5 h-3.5 text-amber-600" />
                  Precio dentro del promedio
                </span>
              )}
              {prediction.recommendation === 'OVERPRICED' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                  Precio por encima de la media
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {prediction.fakeDiscountAnalysis?.explanation ||
                prediction.recommendationReason}
            </p>
          </div>
        )}

        {/* Multi-Store Price Comparison (Clean List) */}
        {otherOffers.length > 1 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <StoreIcon className="w-3.5 h-3.5 text-slate-700" />
                <span>Comparativa en otras tiendas ({otherOffers.length})</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Precios verificados
              </span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {otherOffers.map((off, idx) => {
                const isCurrent = off.id === offer.id;
                const isCheapest = idx === 0;
                const diff = Number(off.price) - Number(otherOffers[0].price);

                return (
                  <div
                    key={off.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                      isCurrent
                        ? 'bg-slate-50 border-slate-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        {off.store?.name || 'Tienda'}
                      </span>
                      {isCheapest && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-700">
                          <Award className="w-3 h-3 text-emerald-600" />
                          Mejor precio
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[11px] text-slate-400 font-normal">
                          (Viendo)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {formatPrice(Number(off.price))}
                        </span>
                        {!isCheapest && (
                          <span className="text-[10px] text-slate-400 block">
                            +{formatPrice(diff)}
                          </span>
                        )}
                      </div>
                      <a
                        href={off.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                      >
                        <span>Ir</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer (Solid Minimalist Controls) */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Precios extraídos y monitoreados en tiempo real (MXN)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onOpenAlert(deal)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Crear Alerta</span>
            </button>

            <a
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              <span>Ir a la tienda</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
