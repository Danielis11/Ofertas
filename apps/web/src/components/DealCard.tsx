import React, { useState } from 'react';
import { ExternalLink, LineChart, Bell, Store, Smartphone, Laptop, Tv, Headphones, Watch, Gamepad2, Package, Shirt, Heart } from 'lucide-react';
import { DealScore } from '../lib/api';
import { DealScoreBadge } from './DealScoreBadge';
import { StoreBadge } from './StoreBadge';

interface Props {
  deal: DealScore;
  onOpenHistory: (deal: DealScore) => void;
  onOpenAlert: (deal: DealScore) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (deal: DealScore) => void;
}

const getBrandOfficialUrl = (brand?: string): { name: string; url: string } | null => {
  if (!brand) return null;
  const bLow = brand.toLowerCase();
  if (bLow.includes('dewalt')) return { name: 'DeWalt México', url: 'https://www.dewalt.com.mx' };
  if (bLow.includes('truper')) return { name: 'Truper Oficial', url: 'https://www.truper.com/' };
  if (bLow.includes('new era')) return { name: 'New Era Oficial', url: 'https://www.newera.mx' };
  if (bLow.includes('sony')) return { name: 'Sony Store Oficial', url: 'https://store.sony.com.mx' };
  if (bLow.includes('nike')) return { name: 'Nike México Oficial', url: 'https://www.nike.com/mx' };
  if (bLow.includes('puma')) return { name: 'Puma México Oficial', url: 'https://mx.puma.com/mx/es' };
  if (bLow.includes('adidas')) return { name: 'Adidas México', url: 'https://www.adidas.mx' };
  if (bLow.includes('motorola')) return { name: 'Motorola México', url: 'https://www.motorola.com.mx' };
  if (bLow.includes('samsung')) return { name: 'Samsung México', url: 'https://www.samsung.com/mx' };
  if (bLow.includes('apple')) return { name: 'Apple México', url: 'https://www.apple.com/mx' };
  if (bLow.includes('levi')) return { name: 'Levi\'s México', url: 'https://www.levi.com.mx' };
  if (bLow.includes('american eagle')) return { name: 'American Eagle México', url: 'https://www.ae.com/mx/es' };
  if (bLow.includes('wrangler')) return { name: 'Wrangler México', url: 'https://www.wrangler.com.mx' };
  if (bLow.includes('lee')) return { name: 'Lee Jeans México', url: 'https://www.lee.com.mx' };
  if (bLow.includes('tommy')) return { name: 'Tommy Hilfiger México', url: 'https://mx.tommy.com' };
  if (bLow.includes('calvin klein')) return { name: 'Calvin Klein México', url: 'https://www.calvinklein.mx' };
  if (bLow.includes('zara')) return { name: 'Zara México', url: 'https://www.zara.com/mx/' };
  if (bLow.includes('pull') || bLow.includes('pull&bear')) return { name: 'Pull&Bear México', url: 'https://www.pullandbear.com/mx/' };
  if (bLow.includes('c&a') || bLow.includes('c and a')) return { name: 'C&A México', url: 'https://www.cyamoda.com' };
  if (bLow.includes('diesel')) return { name: 'Diesel México', url: 'https://www.diesel.com/mx' };
  if (bLow.includes('dockers')) return { name: 'Dockers México', url: 'https://www.dockers.com.mx' };
  if (bLow.includes('oster')) return { name: 'Oster México', url: 'https://www.oster.com.mx' };
  if (bLow.includes('whirlpool')) return { name: 'Whirlpool México', url: 'https://www.whirlpool.mx' };
  if (bLow.includes('vans')) return { name: 'Vans México', url: 'https://www.vans.mx' };
  if (bLow.includes('xiaomi')) return { name: 'Xiaomi México', url: 'https://www.mi.com/mx' };
  if (bLow.includes('lenovo')) return { name: 'Lenovo México', url: 'https://www.lenovo.com/mx' };
  if (bLow.includes('hp')) return { name: 'HP México', url: 'https://www.hp.com/mx-es' };
  if (bLow.includes('asus')) return { name: 'ASUS México', url: 'https://www.asus.com/mx' };
  if (bLow.includes('lg')) return { name: 'LG México', url: 'https://www.lg.com/mx' };
  if (bLow.includes('dell') || bLow.includes('alienware')) return { name: 'Dell Technologies México', url: 'https://www.dell.com/es-mx' };
  if (bLow.includes('nintendo')) return { name: 'Nintendo Oficial', url: 'https://www.nintendo.com/es-mx' };
  if (bLow.includes('steam')) return { name: 'Steam Store', url: 'https://store.steampowered.com' };
  if (bLow.includes('epic')) return { name: 'Epic Games Store', url: 'https://store.epicgames.com/es-MX/' };
  if (bLow.includes('miniso')) return { name: 'Miniso México', url: 'https://www.miniso.com.mx' };
  return null;
};

const getProductIcon = (product?: { name?: string; brand?: string }) => {
  const text = `${product?.name || ''} ${product?.brand || ''}`.toLowerCase();
  if (text.includes('tv') || text.includes('pantalla') || text.includes('monitor')) return Tv;
  if (text.includes('celular') || text.includes('phone') || text.includes('poco') || text.includes('redmi') || text.includes('galaxy') || text.includes('moto') || text.includes('xiaomi 1') || text.includes('smartphone')) return Smartphone;
  if (text.includes('laptop') || text.includes('notebook') || text.includes('macbook') || text.includes('computadora') || text.includes('pc')) return Laptop;
  if (text.includes('audifono') || text.includes('audífono') || text.includes('buds') || text.includes('headphone') || text.includes('headset') || text.includes('auricular')) return Headphones;
  if (text.includes('watch') || text.includes('reloj') || text.includes('band')) return Watch;
  if (text.includes('playstation') || text.includes('ps5') || text.includes('switch') || text.includes('nintendo') || text.includes('xbox') || text.includes('consola') || text.includes('dualsense')) return Gamepad2;
  if (text.includes('jean') || text.includes('pantalon') || text.includes('pantalón') || text.includes('chamarra') || text.includes('ropa') || text.includes('playera') || text.includes('camisa') || text.includes('denim')) return Shirt;
  return Package;
};

export const DealCard: React.FC<Props> = ({
  deal,
  onOpenHistory,
  onOpenAlert,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { offer, savingsPercentage } = deal;
  const product = offer.product;
  const store = offer.store;
  const officialBrand = getBrandOfficialUrl(product?.brand);
  const [imgError, setImgError] = useState(false);
  const FallbackIcon = getProductIcon(product);

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: offer.currency || 'MXN',
    maximumFractionDigits: 2,
  }).format(Number(offer.price));

  const isFreshToday = React.useMemo(() => {
    if (!offer.lastSeen && !offer.updatedAt) return true;
    const date = new Date(offer.lastSeen || offer.updatedAt);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  }, [offer.lastSeen, offer.updatedAt]);

  const slug = (store?.slug || '').toLowerCase();
  const isMarketplaceOfficial =
    (slug.includes('amazon') || slug.includes('mercado')) &&
    (offer.isOfficialStore || (offer.sellerName && offer.sellerName.toLowerCase().includes('oficial')));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all duration-150 flex flex-col justify-between overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header: Store Badge & Savings */}
        <div className="flex items-center justify-between gap-2">
          <StoreBadge
            store={store}
            brand={product?.brand}
            sellerName={offer.sellerName}
            isOfficialStore={offer.isOfficialStore}
          />

          {savingsPercentage > 0 && (
            <span className="text-rose-600 font-bold text-xs shrink-0 whitespace-nowrap">
              -{savingsPercentage}% ahorro
            </span>
          )}
        </div>

        {/* Product Image */}
        <div className="h-44 w-full flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden p-3 border border-slate-100 relative group">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleFavorite(deal);
              }}
              className={`absolute top-2 right-2 p-1.5 rounded-full border transition-all duration-150 z-10 ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-xs'
                  : 'bg-white/90 border-slate-200/80 text-slate-400 hover:text-rose-500 hover:bg-white shadow-2xs'
              }`}
              title={isFavorite ? 'Quitar de Me Gusta' : 'Guardar en Me Gusta'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}

          {product?.image && !imgError ? (
            <img
              src={product.image}
              alt={product.name}
              className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2 border border-slate-200">
                <FallbackIcon className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600 line-clamp-1">
                {product?.brand || 'Producto'}
              </span>
              <span className="text-[10px] text-slate-400">
                Foto en actualización
              </span>
            </div>
          )}
        </div>

        {/* Product Info & Brand Tag */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {product?.brand && (
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider truncate">
                  {product.brand}
                </span>
              )}
              {isMarketplaceOfficial && (
                <span
                  className="text-[11px] font-medium text-emerald-700 shrink-0 whitespace-nowrap"
                  title={offer.sellerName || `Tienda Oficial ${product?.brand || ''}`}
                >
                  · Tienda oficial
                </span>
              )}
            </div>
            {officialBrand && (
              <a
                href={officialBrand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:underline transition-colors shrink-0 whitespace-nowrap"
                title={`Abrir página oficial de ${officialBrand.name}`}
              >
                <span>Marca oficial</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
            {product?.name || 'Producto en oferta'}
          </h3>
        </div>

        {/* Price & Deal Score */}
        <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] text-slate-400 font-medium">Precio Actual</span>
              {isFreshToday ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700" title="Verificada y activa hoy">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Hoy
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-400" title="Verificada recientemente">
                  · Activa
                </span>
              )}
            </div>
            <span className="text-lg font-black text-slate-900">{formattedPrice}</span>
          </div>
          <DealScoreBadge deal={deal} />
        </div>

        {/* Multi-Store Real Price Comparison for this exact device */}
        {deal.otherStores && deal.otherStores.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Store className="w-3 h-3 text-slate-500" />
                Disponible en {deal.otherStores.length + 1} tiendas
              </span>
              {deal.otherStores[deal.otherStores.length - 1].price > Number(offer.price) && (
                <span className="text-[11px] font-medium text-emerald-700">
                  Ahorro vs max: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(deal.otherStores[deal.otherStores.length - 1].price - Number(offer.price))}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
              {/* Current Store */}
              <span className="font-bold text-slate-900">
                {store?.name?.split(' ')[0] || 'Aquí'}: {formattedPrice}
              </span>

              {/* Other Stores */}
              {deal.otherStores.slice(0, 3).map((os, idx) => (
                <a
                  key={idx}
                  href={os.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-slate-600 hover:text-slate-900 hover:underline transition-colors"
                  title={`${os.storeName}: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(os.price)}`}
                >
                  <span className="text-slate-400">{os.storeName.split(' ')[0]}:</span>
                  <span className="font-semibold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(os.price)}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              ))}

              {deal.otherStores.length > 3 && (
                <button
                  onClick={() => onOpenHistory(deal)}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline decoration-slate-300"
                >
                  +{deal.otherStores.length - 3} más
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: Minimalist & Solid */}
      <div className="bg-slate-50 p-2.5 border-t border-slate-100 grid grid-cols-3 gap-2">
        <button
          onClick={() => onOpenHistory(deal)}
          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          title="Ver Historial de Precios"
        >
          <LineChart className="w-3.5 h-3.5 text-slate-500" />
          <span>Historial</span>
        </button>

        <button
          onClick={() => onOpenAlert(deal)}
          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          title="Crear Alerta de Precio"
        >
          <Bell className="w-3.5 h-3.5 text-amber-600" />
          <span>Alerta</span>
        </button>

        <a
          href={offer.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <span>Ir a tienda</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
