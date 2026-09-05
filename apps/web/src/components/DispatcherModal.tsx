import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Send, CheckCircle2, Cpu } from 'lucide-react';
import { api, ScraperStatus } from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DispatcherModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<ScraperStatus | null>(null);
  const [storeSlug, setStoreSlug] = useState('amazon-mx');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  const loadStatus = () => {
    api.getScraperStatus().then(setStatus).catch(() => null);
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setDispatchedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    try {
      await api.dispatchScraper({
        storeSlug,
        searchQuery: searchQuery || undefined,
        category: category || undefined,
        priority,
      });
      setDispatchedSuccess(true);
      loadStatus();
    } catch {
      alert('Error despachando scraping');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3 text-orange-600">
          <Cpu className="w-5 h-5" />
          <h2 className="text-base font-bold text-slate-900">Scraper Dispatcher & Cron Engine</h2>
        </div>

        {/* Scheduler Status Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl mb-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Scheduler Automatizado:</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full">
              {status?.schedulerEnabled ? 'Activo (Cada hora)' : 'Inactivo'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Tareas Despachadas:</span>
            <span className="font-bold text-orange-400">{status?.totalDispatchedJobs ?? 0}</span>
          </div>

          {status?.lastDispatchedAt && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Última ejecución:</span>
              <span className="text-slate-300">{new Date(status.lastDispatchedAt).toLocaleTimeString('es-MX')}</span>
            </div>
          )}
        </div>

        {/* Manual Trigger Form */}
        <form onSubmit={handleDispatch} className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Despachar Raspado Bajo Demanda (RabbitMQ)
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tienda Objetivo</label>
            <select
              value={storeSlug}
              onChange={(e) => setStoreSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500"
            >
              <option value="amazon-mx">Amazon México</option>
              <option value="mercado-libre-mx">Mercado Libre México</option>
              <option value="walmart-mx">Walmart México</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Búsqueda / Producto</label>
            <input
              type="text"
              placeholder="Ej: nintendo switch oled, macbook m3, airpods"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría (Opcional)</label>
              <input
                type="text"
                placeholder="electronica, videojuegos"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="HIGH">Alta (Inmediata)</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Baja</option>
              </select>
            </div>
          </div>

          {dispatchedSuccess && (
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Tarea de scraping enviada a RabbitMQ con éxito!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={dispatching}
            className="w-full py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {dispatching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{dispatching ? 'Despachando...' : 'Despachar Tarea a Spiders'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
