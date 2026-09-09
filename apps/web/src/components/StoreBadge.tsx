import React from 'react';
import { Store, ShieldCheck, Gamepad2, Award } from 'lucide-react';

interface Props {
  store?: {
    id?: string;
    name?: string;
    slug?: string;
    logo?: string;
  };
  brand?: string;
  sellerName?: string;
  isOfficialStore?: boolean;
  className?: string;
}

export const StoreBadge: React.FC<Props> = ({
  store,
  brand,
  sellerName,
  isOfficialStore = false,
  className = '',
}) => {
  const slug = (store?.slug || '').toLowerCase();
  const name = store?.name || 'Tienda';
  const isMarketplaceOfficial =
    (slug.includes('amazon') || slug.includes('mercado')) &&
    (isOfficialStore || (sellerName && sellerName.toLowerCase().includes('oficial')));

  const isOfficial =
    slug.includes('sony') ||
    slug.includes('steam') ||
    slug.includes('epic') ||
    slug.includes('newera') ||
    slug.includes('nike') ||
    slug.includes('puma') ||
    slug.includes('motorola') ||
    slug.includes('miniso') ||
    slug.includes('levi') ||
    slug.includes('oster') ||
    slug.includes('whirlpool') ||
    slug.includes('vans') ||
    slug.includes('samsung') ||
    slug.includes('apple') ||
    slug.includes('xiaomi') ||
    slug.includes('dewalt') ||
    slug.includes('lenovo') ||
    slug.includes('asus') ||
    slug.includes('lg') ||
    slug.includes('dell') ||
    slug.includes('hp');

  const isMarketplace = slug.includes('amazon') || slug.includes('mercado');

  // Custom vector logos for guaranteed 100% render without broken images
  const renderStoreLogo = () => {
    if (slug.includes('asus')) {
      return (
        <span className="px-1.5 py-0.2 bg-blue-950 text-white text-[9px] font-black rounded shrink-0 tracking-tight">
          ASUS
        </span>
      );
    }

    if (slug.includes('lg-') || slug === 'lg-mx') {
      return (
        <span className="w-4 h-4 rounded-full bg-rose-700 flex items-center justify-center text-white text-[9px] font-black shrink-0">
          LG
        </span>
      );
    }

    if (slug.includes('dell')) {
      return (
        <span className="w-4 h-4 rounded-full bg-sky-800 flex items-center justify-center text-white text-[7px] font-black shrink-0">
          DELL
        </span>
      );
    }

    if (slug.includes('epic')) {
      return (
        <span className="px-1.5 py-0.2 bg-black text-white text-[9px] font-black rounded shrink-0 tracking-tight border border-slate-700">
          EPIC
        </span>
      );
    }

    if (slug.includes('steam')) {
      return (
        <span className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
          <Gamepad2 className="w-2.5 h-2.5 text-sky-400" />
        </span>
      );
    }

    if (slug.includes('sony')) {
      return (
        <span className="px-1 py-0.2 bg-black text-white text-[9px] font-black rounded tracking-tighter shrink-0">
          SONY
        </span>
      );
    }

    if (slug.includes('newera')) {
      return (
        <span className="px-1 py-0.2 bg-black text-white text-[9px] font-black rounded tracking-tight shrink-0">
          NEW ERA
        </span>
      );
    }

    if (slug.includes('levi')) {
      return (
        <span className="px-1 py-0.2 bg-red-600 text-white text-[9px] font-black rounded shrink-0">
          LEVI'S
        </span>
      );
    }

    if (slug.includes('oster')) {
      return (
        <span className="px-1 py-0.2 bg-red-700 text-white text-[9px] font-black rounded shrink-0">
          OSTER
        </span>
      );
    }

    if (slug.includes('whirlpool')) {
      return (
        <span className="px-1 py-0.2 bg-blue-900 text-white text-[9px] font-black rounded shrink-0">
          WHIRLPOOL
        </span>
      );
    }

    if (slug.includes('vans')) {
      return (
        <span className="px-1 py-0.2 bg-black text-white text-[9px] font-black rounded shrink-0">
          VANS
        </span>
      );
    }

    if (slug.includes('samsung')) {
      return (
        <span className="px-1 py-0.2 bg-blue-600 text-white text-[9px] font-black rounded shrink-0">
          SAMSUNG
        </span>
      );
    }

    if (slug.includes('apple')) {
      return (
        <span className="w-4 h-4 rounded-full bg-black flex items-center justify-center text-white text-[10px] shrink-0 font-bold leading-none">
          
        </span>
      );
    }

    if (slug.includes('xiaomi')) {
      return (
        <span className="w-4 h-4 rounded bg-orange-600 flex items-center justify-center text-white text-[9px] font-black shrink-0">
          mi
        </span>
      );
    }

    if (slug.includes('dewalt')) {
      return (
        <span className="px-1 py-0.2 bg-amber-400 text-black text-[9px] font-black rounded shrink-0">
          DEWALT
        </span>
      );
    }

    if (slug.includes('lenovo')) {
      return (
        <span className="px-1 py-0.2 bg-red-600 text-white text-[9px] font-black rounded shrink-0">
          LENOVO
        </span>
      );
    }

    if (slug.includes('hp')) {
      return (
        <span className="w-4 h-4 rounded-full bg-sky-600 flex items-center justify-center text-white text-[9px] font-black shrink-0 italic">
          hp
        </span>
      );
    }

    if (slug.includes('nike')) {
      return (
        <span className="px-1 py-0.2 bg-black text-white text-[9px] font-black rounded shrink-0 tracking-tighter">
          NIKE
        </span>
      );
    }

    if (slug.includes('puma')) {
      return (
        <span className="px-1 py-0.2 bg-black text-white text-[9px] font-black rounded shrink-0">
          PUMA
        </span>
      );
    }

    if (slug.includes('elektra')) {
      return (
        <span className="w-4 h-4 rounded bg-red-600 flex items-center justify-center text-white text-[9px] font-black shrink-0">
          E
        </span>
      );
    }

    if (slug.includes('doto')) {
      return (
        <span className="w-4 h-4 rounded bg-emerald-600 flex items-center justify-center text-white text-[9px] font-black shrink-0">
          D
        </span>
      );
    }

    if (slug.includes('marti')) {
      return (
        <span className="w-4 h-4 rounded bg-blue-700 flex items-center justify-center text-white text-[9px] font-black shrink-0">
          M
        </span>
      );
    }

    if (slug.includes('miniso')) {
      return (
        <span className="w-4 h-4 rounded bg-rose-500 flex items-center justify-center text-white text-[9px] font-black shrink-0">
          M
        </span>
      );
    }

    if (slug.includes('motorola')) {
      return (
        <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-black shrink-0">
          M
        </span>
      );
    }

    if (slug.includes('mercado')) {
      return (
        <span className="px-1.5 py-0.2 bg-yellow-400 text-blue-900 text-[9px] font-black rounded shrink-0">
          ML
        </span>
      );
    }

    if (slug.includes('amazon')) {
      return (
        <span className="px-1 py-0.2 bg-amber-500 text-slate-900 text-[9px] font-black rounded shrink-0">
          a
        </span>
      );
    }

    return <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
  };

  const displayName = name
    .replace(/\s*México\s*/gi, '')
    .replace(/\s*Oficial\s*/gi, '')
    .replace(/\s*Store\s*/gi, '')
    .trim() || name;

  return (
    <div className={`flex items-center gap-1.5 text-xs text-slate-700 min-w-0 ${className}`}>
      {renderStoreLogo()}
      <span className="font-semibold text-slate-800 truncate" title={name}>
        {displayName}
      </span>
      {isMarketplaceOfficial || isOfficial ? (
        <span className="text-[11px] font-medium text-emerald-700 shrink-0">
          · Oficial
        </span>
      ) : null}
    </div>
  );
};
