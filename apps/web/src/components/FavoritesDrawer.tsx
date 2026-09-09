import React, { useEffect, useRef } from 'react';
import { Heart, X, LineChart, ExternalLink, Trash2 } from 'lucide-react';
import { DealScore } from '../lib/api';
import { StoreBadge } from './StoreBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  favorites: DealScore[];
  onRemoveFavorite: (offerId: string) => void;
  onClearFavorites: () => void;
  onOpenHistory: (deal: DealScore) => void;
}

export const FavoritesDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onClearFavorites,
  onOpenHistory,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end transition-opacity">
      <div
        ref={drawerRef}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="text-sm font-bold text-slate-900">Mis Me Gusta</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
              {favorites.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {favorites.length > 0 && (
              <button
                onClick={onClearFavorites}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Limpiar todos los favoritos"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body / List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {favorites.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                <Heart className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No tienes productos en Me Gusta</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Haz clic en el corazón de cualquier producto para guardarlo aquí y seguir su recorrido completo de precio en tiempo real.
                </p>
              </div>
            </div>
          ) : (
            favorites.map((deal) => {
              const { offer, savingsPercentage } = deal;
              const product = offer.product;
              const formattedPrice = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: offer.currency || 'MXN',
                maximumFractionDigits: 0,
              }).format(Number(offer.price));

              return (
                <div key={offer.id} className="p-3 hover:bg-slate-50/80 transition-colors rounded-xl space-y-2.5">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      {product?.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain mix-blend-multiply"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">DH</span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <StoreBadge
                          store={offer.store}
                          brand={product?.brand}
                          sellerName={offer.sellerName}
                          isOfficialStore={offer.isOfficialStore}
                        />
                        <button
                          onClick={() => onRemoveFavorite(offer.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                          title="Eliminar de Me Gusta"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                        {product?.name || 'Producto'}
                      </h4>

                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-sm font-bold text-slate-900">{formattedPrice}</span>
                        {savingsPercentage > 0 && (
                          <span className="text-[11px] font-bold text-rose-600">
                            -{savingsPercentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        onOpenHistory(deal);
                        onClose();
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                    >
                      <LineChart className="w-3.5 h-3.5 text-slate-600" />
                      <span>Ver Recorrido</span>
                    </button>

                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                    >
                      <span>Ir a tienda</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {favorites.length > 0 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
            <span className="text-[11px] text-slate-500">
              {favorites.length} {favorites.length === 1 ? 'producto monitoreado' : 'productos monitoreados'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
