import React, { useState } from 'react';
import { X, Bell, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DealScore, api } from '../lib/api';

interface Props {
  deal: DealScore | null;
  onClose: () => void;
}

export const AlertModal: React.FC<Props> = ({ deal, onClose }) => {
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [channels, setChannels] = useState<string[]>(['IN_APP', 'EMAIL']);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (deal) {
      // Suggest 10% lower target price
      const current = Number(deal.offer.price);
      setTargetPrice(Math.round(current * 0.9));
      setSubmitted(false);
      setError('');
    }
  }, [deal]);

  if (!deal) return null;

  const currentPrice = Number(deal.offer.price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create guest or user alert demo
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error al crear alerta');
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (ch: string) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-amber-500 mb-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-base font-bold text-slate-900">Configurar Alerta de Precio</h2>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Te notificaremos en tiempo real a través de RabbitMQ tan pronto el precio baje a tu objetivo.
        </p>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">¡Alerta Guardada con Éxito!</h3>
            <p className="text-xs text-slate-500">
              Vigilaremos {deal.offer.product?.name} en {deal.offer.store?.name}. Recibirás una notificación cuando llegue a ${targetPrice}.
            </p>
            <button
              onClick={onClose}
              className="mt-3 w-full py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 block">Precio Actual:</span>
                <span className="font-bold text-slate-800 text-sm">${currentPrice} MXN</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Tienda:</span>
                <span className="font-semibold text-orange-600">{deal.offer.store?.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Precio Objetivo Deseado (MXN)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  min={1}
                  max={currentPrice}
                  required
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Ahorro esperado de ${currentPrice - targetPrice} MXN ({(((currentPrice - targetPrice) / currentPrice) * 100).toFixed(0)}%)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Canales de Notificación
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleChannel('IN_APP')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                    channels.includes('IN_APP')
                      ? 'bg-amber-50 border-amber-400 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  En la App
                </button>
                <button
                  type="button"
                  onClick={() => toggleChannel('EMAIL')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                    channels.includes('EMAIL')
                      ? 'bg-amber-50 border-amber-400 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Correo Electrónico
                </button>
              </div>
            </div>

            {channels.includes('EMAIL') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tu Correo</label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {error && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Activar Alerta de Precio'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
