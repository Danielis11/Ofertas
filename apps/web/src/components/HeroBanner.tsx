import React from 'react';
import { Flame, ShieldCheck, Zap, TrendingDown } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950 text-white py-10 border-b border-orange-500/20 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Motor Algorítmico de Deals en Tiempo Real</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Caza ofertas auténticas antes de que se agoten.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Monitoreamos millones de cambios de precio en Amazon México, Mercado Libre y Walmart. Evaluamos cada oferta comparándola con su histórico real para calificarla de 0 a 100 puntos.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-2xl font-black text-orange-400 block">&ge; 85 pts</span>
              <span className="text-xs text-slate-300 font-medium">Super Deals Verificados</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-2xl font-black text-emerald-400 block">-20% a -60%</span>
              <span className="text-xs text-slate-300 font-medium">Ahorro Promedio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
