import React from 'react';
import { ShieldCheck, TrendingDown, CheckCircle2 } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <div className="bg-stone-50 text-stone-900 py-6 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-stone-200 text-stone-800 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
              <span>Comparador de Tiendas Oficiales en México</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-snug">
              Precios transparentes y ofertas auténticas en un solo lugar.
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Monitoreamos directamente tiendas oficiales de marcas (Samsung, ASUS, LG, Dell, Apple, Sony, Nike, DeWalt) y grandes plataformas (Amazon, Mercado Libre, Steam). Precios verificados en pesos mexicanos (MXN).
            </p>
          </div>

          {/* Minimalist Feature Tags without arbitrary numbers */}
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs text-stone-700 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-stone-900 block">Tiendas Oficiales</span>
                <span className="text-[11px] text-stone-500">Enlaces y distribuidores verificados</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs text-stone-700 shadow-2xs">
              <TrendingDown className="w-4 h-4 text-sky-600 shrink-0" />
              <div>
                <span className="font-bold text-stone-900 block">Historial Real</span>
                <span className="text-[11px] text-stone-500">Detección de ofertas falsas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
