import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Store as StoreType } from '../lib/api';

export interface StoreShowcaseItem {
  id: string;
  name: string;
  slug: string;
  domain: string;
  defaultCount: number;
  renderLogo: (isSelected: boolean) => React.ReactNode;
}

export const OFFICIAL_STORES: StoreShowcaseItem[] = [
  {
    id: 'ml',
    name: 'Mercado Libre',
    slug: 'mercado-libre-mx',
    domain: 'mercadolibre.com.mx',
    defaultCount: 1931,
    renderLogo: () => (
      <svg viewBox="0 0 168 46" className="h-8 sm:h-9 w-auto select-none" aria-label="Mercado Libre">
        {/* Yellow oval badge with handshake */}
        <g transform="translate(4, 3)">
          <ellipse cx="21" cy="20" rx="20" ry="16" fill="#FFE600" />
          <path
            d="M10 22.5c2-2 4.5-3 7.5-1l3 2c1 .7 2 .7 3 0l3-2c3-2 5.5-1 7.5 1"
            fill="none"
            stroke="#0B1B4F"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M12 17.5l5.5-3.5c1.5-.9 3-.4 4 .8l2 2.2 2-2.2c1-1.2 2.5-1.7 4-.8l5.5 3.5"
            fill="none"
            stroke="#0B1B4F"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </g>
        {/* Navy "mercado libre" text */}
        <text
          x="53"
          y="22"
          fill="#0B1B4F"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="17"
          letterSpacing="-0.4"
        >
          mercado
        </text>
        <text
          x="53"
          y="38"
          fill="#0B1B4F"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="17"
          letterSpacing="-0.4"
        >
          libre
        </text>
      </svg>
    ),
  },
  {
    id: 'amazon',
    name: 'Amazon México',
    slug: 'amazon-mx',
    domain: 'amazon.com.mx',
    defaultCount: 986,
    renderLogo: () => (
      <svg viewBox="0 0 150 44" className="h-7 sm:h-8 w-auto select-none" aria-label="Amazon">
        <text
          x="6"
          y="27"
          fill="#111827"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="29"
          letterSpacing="-1.3"
        >
          amazon
        </text>
        {/* Curved orange smile arrow */}
        <path
          d="M20 34c26 10 70 10 90-4"
          fill="none"
          stroke="#FF9900"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path
          d="M109 27c1.5 2 3.5 3.5 6 3.8-1.5 1.5-3.5 2.5-5.5 3.2.4-1.2.6-2.5.5-3.8l-1-3.2z"
          fill="#FF9900"
        />
      </svg>
    ),
  },
  {
    id: 'liverpool',
    name: 'Liverpool',
    slug: 'liverpool-mx',
    domain: 'liverpool.com.mx',
    defaultCount: 936,
    renderLogo: () => (
      <svg viewBox="0 0 165 42" className="h-7 sm:h-8 w-auto select-none" aria-label="Liverpool">
        {/* Concentric squares icon */}
        <g transform="translate(6, 6)">
          <rect x="0" y="0" width="28" height="28" rx="4" fill="#E10098" />
          <rect x="4" y="4" width="20" height="20" rx="2" fill="white" />
          <rect x="8" y="8" width="12" height="12" rx="1" fill="#E10098" />
          <rect x="11" y="11" width="6" height="6" fill="white" />
          <line x1="14" y1="4" x2="14" y2="24" stroke="#E10098" strokeWidth="2" />
        </g>
        <text
          x="44"
          y="28"
          fill="#E10098"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="22"
          letterSpacing="-0.5"
        >
          Liverpool
        </text>
        <circle cx="146" cy="14" r="1.5" fill="#E10098" />
      </svg>
    ),
  },
  {
    id: 'sears',
    name: 'Sears',
    slug: 'sears-mx',
    domain: 'sears.com.mx',
    defaultCount: 140,
    renderLogo: () => (
      <svg viewBox="0 0 148 40" className="h-7 sm:h-8 w-auto select-none" aria-label="Sears">
        <text
          x="6"
          y="30"
          fill="#E31837"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="32"
          letterSpacing="1.2"
        >
          SEARS
        </text>
        <text
          x="132"
          y="14"
          fill="#E31837"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="9"
        >
          ®
        </text>
      </svg>
    ),
  },
  {
    id: 'walmart',
    name: 'Walmart México',
    slug: 'walmart-mx',
    domain: 'walmart.com.mx',
    defaultCount: 565,
    renderLogo: () => (
      <svg viewBox="0 0 165 40" className="h-7 sm:h-8 w-auto select-none" aria-label="Walmart">
        <text
          x="4"
          y="29"
          fill="#0071DC"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="27"
          letterSpacing="-0.5"
        >
          Walmart
        </text>
        {/* Yellow spark */}
        <g transform="translate(132, 19)">
          <line x1="0" y1="-10" x2="0" y2="-3" stroke="#FFC220" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="0" y1="3" x2="0" y2="10" stroke="#FFC220" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="-9" y1="-5.5" x2="-3" y2="-1.8" stroke="#FFC220" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="3" y1="1.8" x2="9" y2="5.5" stroke="#FFC220" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="-9" y1="5.5" x2="-3" y2="1.8" stroke="#FFC220" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="3" y1="-1.8" x2="9" y2="-5.5" stroke="#FFC220" strokeWidth="3.2" strokeLinecap="round" />
        </g>
      </svg>
    ),
  },
  {
    id: 'costco',
    name: 'Costco México',
    slug: 'costco-mx',
    domain: 'costco.com.mx',
    defaultCount: 494,
    renderLogo: () => (
      <svg viewBox="0 0 156 44" className="h-7 sm:h-8 w-auto select-none" aria-label="Costco">
        <text
          x="6"
          y="25"
          fill="#E31837"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="26"
          letterSpacing="0.8"
        >
          COSTCO
        </text>
        <g transform="translate(7, 30)">
          <line x1="0" y1="5" x2="16" y2="5" stroke="#005DAA" strokeWidth="1.8" />
          <text
            x="22"
            y="9.5"
            fill="#005DAA"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="10.5"
            letterSpacing="2"
          >
            WHOLESALE
          </text>
          <line x1="117" y1="5" x2="133" y2="5" stroke="#005DAA" strokeWidth="1.8" />
        </g>
      </svg>
    ),
  },
  {
    id: 'palacio',
    name: 'Palacio de Hierro',
    slug: 'palacio-mx',
    domain: 'elpalaciodehierro.com',
    defaultCount: 703,
    renderLogo: () => (
      <svg viewBox="0 0 180 44" className="h-7 sm:h-8 w-auto select-none" aria-label="El Palacio de Hierro">
        <text
          x="90"
          y="29"
          fill="#C5A059"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontWeight="bold"
          fontSize="18"
          textAnchor="middle"
          letterSpacing="0.3"
        >
          El Palacio de Hierro
        </text>
      </svg>
    ),
  },
  {
    id: 'elektra',
    name: 'Elektra',
    slug: 'elektra-mx',
    domain: 'elektra.mx',
    defaultCount: 2390,
    renderLogo: () => (
      <svg viewBox="0 0 148 40" className="h-7 sm:h-8 w-auto select-none" aria-label="Elektra">
        <rect x="5" y="6" width="28" height="28" rx="8" fill="#E31837" />
        <path d="M13 13h12v3h-8v3.5h7v3h-7V26h8.5v3H13V13z" fill="#FFFFFF" />
        <circle cx="26" cy="14" r="2.2" fill="#FFD100" />
        <text
          x="42"
          y="28"
          fill="#E31837"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="23"
          letterSpacing="-0.5"
        >
          Elektra
        </text>
      </svg>
    ),
  },
  {
    id: 'doto',
    name: 'Doto México',
    slug: 'doto-mx',
    domain: 'doto.com.mx',
    defaultCount: 1064,
    renderLogo: () => (
      <svg viewBox="0 0 135 40" className="h-7 sm:h-8 w-auto select-none" aria-label="Doto">
        <text
          x="4"
          y="29"
          fill="#111827"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="29"
          letterSpacing="-0.8"
        >
          doto
        </text>
        <circle cx="27" cy="11.5" r="3.4" fill="#00D2B5" />
        <circle cx="77" cy="11.5" r="3.4" fill="#00D2B5" />
        <text
          x="97"
          y="29"
          fill="#00D2B5"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="13"
        >
          .com.mx
        </text>
      </svg>
    ),
  },
  {
    id: 'marti',
    name: 'Martí México',
    slug: 'marti-mx',
    domain: 'marti.mx',
    defaultCount: 691,
    renderLogo: () => (
      <svg viewBox="0 0 138 40" className="h-7 sm:h-8 w-auto select-none" aria-label="Martí">
        <text
          x="6"
          y="29"
          fill="#0033A0"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="27"
          letterSpacing="0.6"
        >
          MARTÍ
        </text>
        <rect x="116" y="8" width="13" height="22" rx="2" fill="#E31837" transform="skewX(-14)" />
        <path d="M120 14l6 5-6 5" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'coppel',
    name: 'Coppel',
    slug: 'coppel-mx',
    domain: 'coppel.com',
    defaultCount: 336,
    renderLogo: () => (
      <svg viewBox="0 0 138 40" className="h-7 sm:h-8 w-auto select-none" aria-label="Coppel">
        <text
          x="6"
          y="29"
          fill="#00529C"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="27"
          letterSpacing="-0.5"
        >
          Coppel
        </text>
        <circle cx="114" cy="14" r="4.5" fill="#FED100" />
        <path d="M114 7v3M114 18v3M107 14h3M118 14h3" stroke="#FED100" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'newera',
    name: 'New Era México',
    slug: 'newera-mx',
    domain: 'newera.mx',
    defaultCount: 1006,
    renderLogo: () => (
      <svg viewBox="0 0 148 40" className="h-7 sm:h-8 w-auto select-none" aria-label="New Era">
        <rect x="5" y="7" width="28" height="26" rx="3" fill="#000000" />
        <path d="M9 13h8l-3 7 7-7h4v14h-4v-7l-7 7H9V13z" fill="#FFFFFF" />
        <text
          x="40"
          y="20"
          fill="#000000"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="13"
          letterSpacing="1"
        >
          NEW
        </text>
        <text
          x="40"
          y="31"
          fill="#000000"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="13"
          letterSpacing="1"
        >
          ERA
        </text>
      </svg>
    ),
  },
  {
    id: 'sony',
    name: 'Sony Store',
    slug: 'sony-mx',
    domain: 'store.sony.com.mx',
    defaultCount: 240,
    renderLogo: () => (
      <svg viewBox="0 0 120 34" className="h-6 sm:h-7 w-auto select-none" aria-label="Sony">
        <path
          d="M12.8 5.6c-.6-.7-1.5-1.1-2.6-1.1-2 0-3.3 1.2-3.3 2.7 0 3.7 9.1 2.3 9.1 8.5 0 3.4-2.8 5.4-6.8 5.4-2.7 0-4.9-.9-6.3-2.3l1.3-2.7c1.1 1.2 3 2.1 4.9 2.1 2.1 0 3.6-1 3.6-2.6 0-3.9-9.1-2.4-9.1-8.5 0-3.1 2.5-5.3 6.3-5.3 2.1 0 4.1.7 5.2 1.8l-2.3 2zM33.6 2.5c6 0 10.3 4.2 10.3 9.4s-4.3 9.4-10.3 9.4-10.3-4.2-10.3-9.4 4.3-9.4 10.3-9.4zm0 15.8c4 0 6.8-2.8 6.8-6.4s-2.8-6.4-6.8-6.4-6.8 2.8-6.8 6.4 2.8 6.4 6.8 6.4zM67.8 2.8v18H64L51.3 6.7v14.1h-3.3v-18h3.8L64.5 17V2.8h3.3zM79.2 13.5l-6.7-10.7h3.8l4.7 7.8 4.7-7.8h3.8l-6.7 10.7v7.3h-3.6v-7.3z"
          fill="#000000"
        />
      </svg>
    ),
  },
  {
    id: 'samsung',
    name: 'Samsung Oficial',
    slug: 'samsung-mx',
    domain: 'samsung.com/mx',
    defaultCount: 24,
    renderLogo: () => (
      <svg viewBox="0 0 138 38" className="h-6 sm:h-7 w-auto select-none" aria-label="Samsung">
        <ellipse cx="69" cy="19" rx="66" ry="17" fill="#034EA2" />
        <text
          x="69"
          y="24"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="13.5"
          textAnchor="middle"
          letterSpacing="1.4"
        >
          SAMSUNG
        </text>
      </svg>
    ),
  },
  {
    id: 'nike',
    name: 'Nike Oficial',
    slug: 'nike-mx',
    domain: 'nike.com/mx',
    defaultCount: 18,
    renderLogo: () => (
      <svg viewBox="0 0 128 38" className="h-6 sm:h-7 w-auto select-none" aria-label="Nike">
        <path
          d="M10 28c8.5-1 24.5-12 34-23-3.2 5.5-6.5 13-17 17.5-8 3.5-14.5 4.5-17 5.5z"
          fill="#000000"
        />
        <text
          x="48"
          y="27"
          fill="#000000"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="24"
          letterSpacing="-0.5"
        >
          NIKE
        </text>
      </svg>
    ),
  },
  {
    id: 'apple',
    name: 'Apple Store',
    slug: 'apple-mx',
    domain: 'apple.com/mx',
    defaultCount: 18,
    renderLogo: () => (
      <svg viewBox="0 0 138 38" className="h-6 sm:h-7 w-auto select-none" aria-label="Apple Store">
        <path
          d="M21 27.5c-.7 1.5-1.5 2.9-2.4 4.3-1.3 1.8-2.3 3-3.2 3.8-1.2 1.1-2.6 1.7-4 1.7-1 0-2.3-.3-3.7-.9-1.4-.6-2.8-.9-4-.9-1.2 0-2.7.3-4.1.9-1.4.6-2.7.9-3.5.9-1.2 0-2.6-.6-4-1.7-1-.8-2.2-2.2-3.4-4-1.7-2.5-3-5.4-4-8.7-1-3.3-1.5-6.4-1.5-9.2 0-4 1-7.3 3.1-10 2.1-2.7 4.8-4 7.9-4.1 1.3 0 2.9.4 4.6 1.1 1.7.8 2.8 1.1 3.2 1.1.4 0 1.5-.4 3.3-1.2 1.8-.8 3.3-1.1 4.7-1 3.5.2 6.3 1.5 8.3 4-3 1.8-4.6 4.3-4.5 7.4.1 2.5 1 4.6 3 6.3 1.9 1.7 4.1 2.6 6.7 2.8-.6 1.8-1.3 3.6-2.2 5.4zM12.5 6c0-2.1.8-3.9 2.2-5.7 1.4-1.8 3.3-2.9 5.5-3.2 0 .3.1.6.1.8 0 2-.8 3.9-2.3 5.7-1.5 1.8-3.3 2.9-5.5 3.2 0-.3 0-.5 0-.8z"
          fill="#000000"
          transform="translate(12, 0) scale(0.62)"
        />
        <text
          x="44"
          y="25"
          fill="#000000"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="17"
          letterSpacing="-0.5"
        >
          Apple Store
        </text>
      </svg>
    ),
  },
];

interface Props {
  selectedStore: string;
  onSelectStore: (storeSlug: string) => void;
  stores?: StoreType[];
}

export const StoreShowcase: React.FC<Props> = ({
  selectedStore,
  onSelectStore,
  stores = [],
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Map real counts from backend if available
  const storeCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    stores.forEach((s) => {
      if (s.slug) {
        map.set(s.slug, s.offerCount || 0);
      }
    });
    return map;
  }, [stores]);

  const updateScrollState = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 360;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleCardClick = (slug: string) => {
    if (selectedStore === slug) {
      onSelectStore('');
    } else {
      onSelectStore(slug);
    }
  };

  const activeStoreObj = OFFICIAL_STORES.find((s) => s.slug === selectedStore);

  return (
    <section className="space-y-3.5 my-2">
      {/* Header with Title and Reset option */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Conoce nuestras tiendas oficiales
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Monitoreo en tiempo real de inventarios y ofertas oficiales verificadas en México
          </p>
        </div>

        {selectedStore && (
          <button
            onClick={() => onSelectStore('')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
            title="Mostrar todas las tiendas"
          >
            <span>Quitar filtro: {activeStoreObj?.name || selectedStore}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Carousel Track with Left/Right Navigation Buttons */}
      <div className="relative group">
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          aria-label="Desplazar tiendas a la izquierda"
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-xs shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:scale-105 active:scale-95 transition-all cursor-pointer ${
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          aria-label="Desplazar tiendas a la derecha"
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-xs shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:scale-105 active:scale-95 transition-all cursor-pointer ${
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none py-1.5 px-0.5 scroll-smooth"
        >
          {OFFICIAL_STORES.map((store) => {
            const isSelected = selectedStore === store.slug;
            const count = storeCountMap.get(store.slug) ?? store.defaultCount;

            return (
              <button
                key={store.slug}
                onClick={() => handleCardClick(store.slug)}
                className={`group/card relative flex flex-col items-center justify-center shrink-0 w-[190px] sm:w-[220px] md:w-[235px] h-24 sm:h-28 rounded-2xl p-4 transition-all duration-200 text-left focus:outline-none cursor-pointer ${
                  isSelected
                    ? 'bg-white ring-2 ring-slate-950 shadow-md border-transparent scale-[1.02]'
                    : 'bg-[#f8f8f9] hover:bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {/* Active Store Indicator Ribbon */}
                {isSelected && (
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    Activa
                  </span>
                )}

                {/* Centered Authentic Vector Logo */}
                <div className="flex items-center justify-center w-full flex-1">
                  {store.renderLogo(isSelected)}
                </div>

                {/* Offer Count / Catalog Meta */}
                <div className="w-full text-center pt-1 mt-auto">
                  <span
                    className={`text-[11px] font-semibold transition-colors ${
                      isSelected ? 'text-slate-900 font-bold' : 'text-slate-500 group-hover/card:text-slate-700'
                    }`}
                  >
                    {count > 0 ? `${count.toLocaleString()} ofertas activas` : 'Catálogo oficial'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
