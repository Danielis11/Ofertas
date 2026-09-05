import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, ArrowUpDown, Sparkles, RefreshCcw } from 'lucide-react';
import { DealScore, SearchResponse, api } from '../lib/api';
import { DealCard } from './DealCard';

interface Props {
  searchQuery: string;
  selectedStore: string;
  onOpenHistory: (deal: DealScore) => void;
  onOpenAlert: (deal: DealScore) => void;
}

export const DealsExplorer: React.FC<Props> = ({
  searchQuery,
  selectedStore,
  onOpenHistory,
  onOpenAlert,
}) => {
  const [deals, setDeals] = useState<DealScore[]>([]);
  const [facets, setFacets] = useState<SearchResponse['facets'] | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('score_desc');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const response = await api.searchDeals({
        q: searchQuery || undefined,
        storeSlug: selectedStore || undefined,
        brand: selectedBrand || undefined,
        minScore,
        sortBy,
        minPrice,
        maxPrice,
        limit: 30,
      });
      setDeals(response.data);
      setFacets(response.facets);
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [searchQuery, selectedStore, minScore, selectedBrand, sortBy, minPrice, maxPrice]);

  const resetFilters = () => {
    setMinScore(undefined);
    setSelectedBrand('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSortBy('score_desc');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                <span>Filtros Avanzados</span>
              </span>
              {(minScore || selectedBrand || minPrice || maxPrice) && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-orange-600 font-semibold hover:underline"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Deal Score Filter */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Deal Score Mínimo</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setMinScore(undefined)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-colors ${
                    minScore === undefined
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setMinScore(70)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-colors ${
                    minScore === 70
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  &ge; 70 pts
                </button>
                <button
                  onClick={() => setMinScore(85)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-colors ${
                    minScore === 85
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  &ge; 85 pts
                </button>
              </div>
            </div>

            {/* Brand Facet Filter */}
            {facets?.brands && facets.brands.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Marcas</label>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <div
                    onClick={() => setSelectedBrand('')}
                    className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      selectedBrand === '' ? 'bg-orange-50 font-bold text-orange-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Todas las marcas</span>
                  </div>
                  {facets.brands.map((b) => (
                    <div
                      key={b.name}
                      onClick={() => setSelectedBrand(selectedBrand === b.name ? '' : b.name)}
                      className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        selectedBrand === b.name
                          ? 'bg-orange-50 font-bold text-orange-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{b.name}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {b.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Rango de Precio (MXN)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice ?? ''}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice ?? ''}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Deals Grid */}
        <main className="flex-1 space-y-6">
          {/* Top Bar: Results Count & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <span className="text-sm font-bold text-slate-800">
                {loading ? 'Buscando ofertas...' : `${deals.length} ofertas encontradas`}
              </span>
              {searchQuery && (
                <span className="text-xs text-slate-500 block">para &quot;{searchQuery}&quot;</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="score_desc">Mejor Deal Score (0-100)</option>
                <option value="discount_desc">Mayor Descuento (%)</option>
                <option value="price_asc">Menor Precio</option>
                <option value="price_desc">Mayor Precio</option>
                <option value="newest">Más Recientes</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 h-96 animate-pulse" />
              ))}
            </div>
          ) : deals.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No se encontraron ofertas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay productos que coincidan con los filtros seleccionados. Prueba ampliando el rango de precios o eliminando filtros.
              </p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-700 transition-colors shadow-sm"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Restablecer Filtros</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <DealCard
                  key={deal.offer.id}
                  deal={deal}
                  onOpenHistory={onOpenHistory}
                  onOpenAlert={onOpenAlert}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
