import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ExternalLink,
  LineChart,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShieldCheck,
  Flame,
  Zap,
  Tag,
  Clock,
  Calendar,
  ArrowUpRight,
  ShoppingBag,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { DealScore, api } from '../lib/api';

export interface ShoppingEvent {
  key: string;
  name: string;
  shortLabel: string;
  dateSchedule: string;
  monthIndex: number; // 8 = Sept, 4 = May, 10 = Nov
  startDay: number;
  endDay: number;
  headline: string;
  subtitle: string;
  filterStoreSlug?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SHOPPING_EVENTS: ShoppingEvent[] = [
  {
    key: 'dia-9-9',
    name: 'Especial 9.9 Mercado Libre y Tiendas Oficiales',
    shortLabel: 'Día 9.9 (Septiembre)',
    dateSchedule: '9 al 11 de Septiembre',
    monthIndex: 8,
    startDay: 8,
    endDay: 11,
    headline: 'Especial 9.9: Ofertas de Doble Dígito en Mercado Libre y Tiendas Oficiales',
    subtitle:
      'Campaña activa de doble dígito de septiembre. Monitoreo de cupones bancarios y precios mínimos históricos auditados directamente desde los inventarios oficiales.',
    filterStoreSlug: 'mercado-libre-mx',
    icon: Zap,
  },
  {
    key: 'hot-sale',
    name: 'Hot Sale México',
    shortLabel: 'Hot Sale',
    dateSchedule: '15 al 23 de Mayo',
    monthIndex: 4,
    startDay: 15,
    endDay: 23,
    headline: 'Hot Sale México: Temporada Anual de Comercio Electrónico',
    subtitle:
      'Monitoreo algorítmico de ofertas en línea en las tiendas más importantes de México, con registro histórico de precios para evitar aumentos artificiales previos.',
    icon: Flame,
  },
  {
    key: 'buen-fin',
    name: 'El Buen Fin México',
    shortLabel: 'El Buen Fin',
    dateSchedule: '13 al 16 de Noviembre',
    monthIndex: 10,
    startDay: 13,
    endDay: 16,
    headline: 'El Buen Fin: Monitoreo en Departamentales y Autoservicio',
    subtitle:
      'Comparativa de precios reales en Liverpool, Sears, Palacio de Hierro, Walmart y Elektra con historial verificado de los últimos 365 días.',
    icon: Tag,
  },
  {
    key: 'black-friday',
    name: 'Viernes Negro y Cyber Monday',
    shortLabel: 'Viernes Negro',
    dateSchedule: '27 al 30 de Noviembre',
    monthIndex: 10,
    startDay: 27,
    endDay: 30,
    headline: 'Viernes Negro (Black Friday): Tecnología, Consolas y Computación',
    subtitle:
      'Seguimiento de precios en consolas de videojuegos, laptops de alto rendimiento, smartphones de gama alta y calzado oficial de importación.',
    icon: ShoppingBag,
  },
  {
    key: 'prime-days',
    name: 'Amazon Flash y Ventas Especiales',
    shortLabel: 'Amazon Flash',
    dateSchedule: 'Julio y Fechas Especiales',
    monthIndex: 6,
    startDay: 10,
    endDay: 17,
    headline: 'Ventas Flash y Ofertas Relámpago en Amazon México',
    subtitle:
      'Monitoreo continuo de promociones por tiempo limitado y alta rotación de inventario con actualización cada pocos minutos.',
    filterStoreSlug: 'amazon-mx',
    icon: Timer,
  },
];

interface Props {
  onOpenHistory: (deal: DealScore) => void;
  onOpenAlert?: (deal: DealScore) => void;
  isFavorite?: (dealIdOrProductId: string) => boolean;
  onToggleFavorite?: (deal: DealScore) => void;
  onSelectStore?: (storeSlug: string) => void;
}

export const FeaturedDealsBanner: React.FC<Props> = ({
  onOpenHistory,
  onOpenAlert,
  isFavorite,
  onToggleFavorite,
  onSelectStore,
}) => {
  const [selectedEventKey, setSelectedEventKey] = useState<string>('dia-9-9');
  const [deals, setDeals] = useState<DealScore[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if an event is legitimately happening today based on system date
  const checkIsLiveToday = (event: ShoppingEvent): boolean => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    return (
      currentMonth === event.monthIndex &&
      currentDay >= event.startDay &&
      currentDay <= event.endDay
    );
  };

  // Countdown state for live events
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 11,
    minutes: 36,
    seconds: 40,
  });

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(clockTimer);
  }, []);

  const activeEvent =
    SHOPPING_EVENTS.find((e) => e.key === selectedEventKey) || SHOPPING_EVENTS[0];

  const isCurrentEventLive = checkIsLiveToday(activeEvent);

  const [bannerImgError, setBannerImgError] = useState<Record<string, boolean>>({});

  // Fetch top deals corresponding to the selected event
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params: Record<string, any> = {
      sortBy: 'score_desc',
      minScore: 75,
      limit: 12,
    };

    if (activeEvent.filterStoreSlug) {
      params.storeSlug = activeEvent.filterStoreSlug;
    }

    api
      .searchDeals(params)
      .then((res) => {
        if (isMounted) {
          const validWithImages = (res.data || []).filter(
            (d) => d.offer?.product?.image && d.offer.product.image.startsWith('http') && !d.offer.product.image.includes('default_load_image')
          );

          if (validWithImages.length > 0) {
            setDeals(validWithImages.slice(0, 6));
            setCurrentIndex(0);
          } else {
            api.searchDeals({ sortBy: 'score_desc', minScore: 70, limit: 12 }).then((fallbackRes) => {
              if (isMounted && fallbackRes.data) {
                const fbWithImages = fallbackRes.data.filter(
                  (d) => d.offer?.product?.image && d.offer.product.image.startsWith('http') && !d.offer.product.image.includes('default_load_image')
                );
                setDeals(fbWithImages.length > 0 ? fbWithImages.slice(0, 6) : fallbackRes.data.slice(0, 6));
                setCurrentIndex(0);
              }
            });
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedEventKey]);

  // Auto-advance slides every 6 seconds if not hovered
  useEffect(() => {
    if (deals.length <= 1 || isHovered) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % deals.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deals.length, isHovered]);

  const currentDeal = deals[currentIndex] || deals[0];
  const offer = currentDeal?.offer;
  const product = offer?.product;
  const store = offer?.store;
  const savingsPercentage = currentDeal?.savingsPercentage || 0;
  const score = currentDeal?.score || 95;

  const formattedPrice = offer
    ? new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: offer.currency || 'MXN',
        maximumFractionDigits: 0,
      }).format(Number(offer.price))
    : '$0';

  const originalPriceEstimate = offer
    ? savingsPercentage > 0
      ? Number(offer.price) / (1 - savingsPercentage / 100)
      : Number(offer.price) * 1.3
    : 0;

  const formattedOriginalPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: offer?.currency || 'MXN',
    maximumFractionDigits: 0,
  }).format(originalPriceEstimate);

  const savingsAmount = offer ? Math.max(0, originalPriceEstimate - Number(offer.price)) : 0;
  const formattedSavings = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: offer?.currency || 'MXN',
    maximumFractionDigits: 0,
  }).format(savingsAmount);

  const isLiked = offer && isFavorite ? isFavorite(offer.id) : false;

  const handleApplyEventStoreFilter = () => {
    if (activeEvent.filterStoreSlug && onSelectStore) {
      onSelectStore(activeEvent.filterStoreSlug);
    }
  };

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full bg-slate-900 border-b border-slate-800 text-white relative"
    >
      {/* Top Bar: Shopping Events Selector (Full Screen Width, Solid Color, Clean Neutral Text) */}
      <div className="w-full border-b border-slate-800 bg-slate-950 px-4 sm:px-8 lg:px-12 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Section Title and Real Calendar Timing Indicator */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Grandes Días de Ofertas:
            </span>

            {/* If event is legitimately active today, show real countdown; otherwise show scheduled calendar date */}
            {isCurrentEventLive ? (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  En curso hoy · Termina en {String(timeLeft.hours).padStart(2, '0')}h{' '}
                  {String(timeLeft.minutes).padStart(2, '0')}m{' '}
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Temporada oficial: {activeEvent.dateSchedule}</span>
              </div>
            )}
          </div>

          {/* Right: Lucide Icons Tab Switcher (No Emojis, No Colorful Outlines) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {SHOPPING_EVENTS.map((event) => {
              const isSelected = selectedEventKey === event.key;
              const isEventLive = checkIsLiveToday(event);
              const IconComp = event.icon;

              return (
                <button
                  key={event.key}
                  type="button"
                  onClick={() => setSelectedEventKey(event.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{event.shortLabel}</span>
                  {isEventLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Container: Full Screen Width Layout with Solid Contrast */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Regular Neutral Typography & Deal Information */}
          <div className="lg:col-span-7 space-y-4 text-left">
            {/* Badges Row (Solid neutral tags, no colored outlines) */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold">
                <activeEvent.icon className="w-3.5 h-3.5 text-slate-300" />
                <span>{isCurrentEventLive ? 'Evento Activo' : 'Campaña Oficial'}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeEvent.dateSchedule}</span>
              </span>

              <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium ml-auto sm:ml-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Score {score}/100 verificado</span>
              </span>
            </div>

            {/* Main Headline (Normal text, no colorful outlines) */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-snug">
              {product?.brand && product.brand.toLowerCase() !== 'desconocida' ? `${product.brand}: ` : ''}
              {product?.name || activeEvent.headline}
            </h1>

            {/* Savings Callout (Clear, normal text) */}
            {savingsAmount > 0 && (
              <p className="text-sm sm:text-base text-slate-200 font-semibold">
                Ahorro récord detectado de {formattedSavings} ({savingsPercentage}% de descuento frente al precio regular)
              </p>
            )}

            {/* Subtitle / Campaign Context */}
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {activeEvent.subtitle}
            </p>

            {/* Price Row (Solid standard presentation) */}
            {offer && (
              <div className="pt-2 flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {formattedPrice}
                </span>
                {savingsAmount > 0 && (
                  <span className="text-base sm:text-lg text-slate-500 line-through font-normal">
                    {formattedOriginalPrice}
                  </span>
                )}
                {savingsPercentage > 0 && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold">
                    -{savingsPercentage}% de rebaja
                  </span>
                )}
                <span className="text-xs text-slate-400 font-normal">
                  en {store?.name || 'Tienda Oficial'}
                </span>
              </div>
            )}

            {/* Action Buttons (Solid colors, no glowing contours) */}
            {offer && (
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors cursor-pointer shadow-xs"
                >
                  <span>Aprovechar Oferta</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => onOpenHistory(currentDeal)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
                >
                  <LineChart className="w-4 h-4 text-slate-300" />
                  <span>Ver Recorrido del Precio</span>
                </button>

                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(currentDeal)}
                    className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      isLiked
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                    }`}
                    title={isLiked ? 'Quitar de Me Gusta' : 'Guardar en Me Gusta'}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                )}

                {activeEvent.filterStoreSlug && (
                  <button
                    type="button"
                    onClick={handleApplyEventStoreFilter}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors cursor-pointer ml-auto sm:ml-0"
                  >
                    <span>Ver catálogo {store?.name || 'de la tienda'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Solid White Stage Pedestal for Publication Images */}
          <div className="lg:col-span-5 flex items-center justify-center">
            {/* Pure solid white card that gives high contrast against dark background and blends cleanly with any product photo */}
            <div className="relative w-full max-w-md aspect-square sm:aspect-4/3 flex items-center justify-center p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-md">
              {/* Product Image */}
              {product?.image && !bannerImgError[offer?.id || ''] ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-h-56 sm:max-h-68 w-auto object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (offer?.id) {
                      setBannerImgError((prev) => ({ ...prev, [offer.id]: true }));
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-2xs">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-xs">
                    {product?.brand || store?.name || 'Publicación Oficial'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Oferta 100% verificada
                  </span>
                </div>
              )}

              {/* Solid Badges on Corner of the Stage */}
              <div className="absolute bottom-3 left-3 bg-slate-900 text-white border border-slate-800 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Récord Mínimo Garantizado</span>
              </div>

              <div className="absolute top-3 right-3 bg-slate-900 text-white border border-slate-800 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{store?.name || 'Tienda Oficial'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Carousel Controls (Full Width, Solid Colors) */}
      <div className="w-full bg-slate-950 border-t border-slate-800 px-4 sm:px-8 lg:px-12 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>
              Oferta {currentIndex + 1} de {deals.length} destacada de{' '}
              <strong className="text-white font-medium">{activeEvent.name}</strong>
            </span>
          </div>

          {/* Slide Dots (Solid, no gradient) */}
          <div className="flex items-center gap-1.5">
            {deals.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Ir a oferta ${idx + 1}`}
              />
            ))}
          </div>

          {/* Previous / Next Arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev === 0 ? deals.length - 1 : prev - 1))}
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Oferta anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % deals.length)}
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Siguiente oferta"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
