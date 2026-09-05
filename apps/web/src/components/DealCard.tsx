import React from 'react';
import { ExternalLink, LineChart, Bell, Store as StoreIcon } from 'lucide-react';
import { DealScore } from '../lib/api';
import { DealScoreBadge } from './DealScoreBadge';

interface Props {
  deal: DealScore;
  onOpenHistory: (deal: DealScore) => void;
  onOpenAlert: (deal: DealScore) => void;
}

export const DealCard: React.FC<Props> = ({ deal, onOpenHistory, onOpenAlert }) => {
  const { offer, savingsPercentage } = deal;
  const product = offer.product;
  const store = offer.store;

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: offer.currency || 'MXN',
    maximumFractionDigits: 2,
  }).format(Number(offer.price));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-4 space-y-3">
        {/* Header: Store Badge & Savings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
            <StoreIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{store?.name || 'Tienda'}</span>
          </div>

          {savingsPercentage > 0 && (
            <span className="bg-rose-50 text-rose-600 font-bold text-xs px-2 py-0.5 rounded-full border border-rose-200">
              -{savingsPercentage}% ahorro
            </span>
          )}
        </div>

        {/* Product Image */}
        <div className="h-44 w-full flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden p-2">
          {product?.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
              <StoreIcon className="w-8 h-8 stroke-1" />
              <span>Sin imagen</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          {product?.brand && (
            <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide">
              {product.brand}
            </span>
          )}
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug hover:text-orange-600 transition-colors">
            {product?.name || 'Producto en oferta'}
          </h3>
        </div>

        {/* Price & Deal Score */}
        <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Precio Actual</span>
            <span className="text-xl font-black text-slate-900">{formattedPrice}</span>
          </div>
          <DealScoreBadge deal={deal} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-slate-50/70 p-3 border-t border-slate-100 grid grid-cols-3 gap-2">
        <button
          onClick={() => onOpenHistory(deal)}
          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors"
          title="Ver Gráfica de Historial de Precios"
        >
          <LineChart className="w-3.5 h-3.5 text-slate-600" />
          <span>Historial</span>
        </button>

        <button
          onClick={() => onOpenAlert(deal)}
          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors"
          title="Crear Alerta de Precio"
        >
          <Bell className="w-3.5 h-3.5 text-amber-500" />
          <span>Alerta</span>
        </button>

        <a
          href={offer.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 shadow-sm transition-colors"
        >
          <span>Ir a tienda</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
