import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCcw,
  X,
  Store,
  Award,
  CheckCircle2,
  Layers,
  Tag,
  DollarSign,
  SearchX,
} from 'lucide-react';
import { DealScore, SearchResponse, Store as StoreType, api } from '../lib/api';
import { DealCard } from './DealCard';
import { BrandShowcase } from './BrandShowcase';
import { StoreShowcase } from './StoreShowcase';

interface Props {
  searchQuery: string;
  selectedStore: string;
  onSelectStore?: (storeSlug: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (categorySlug: string) => void;
  onOpenHistory: (deal: DealScore) => void;
  onOpenAlert: (deal: DealScore) => void;
  isFavorite?: (dealIdOrProductId: string) => boolean;
  onToggleFavorite?: (deal: DealScore) => void;
}

export const DealsExplorer: React.FC<Props> = ({
  searchQuery,
  selectedStore,
  onSelectStore,
  selectedCategory,
  onSelectCategory,
  onOpenHistory,
  onOpenAlert,
  isFavorite,
  onToggleFavorite,
}) => {
  const [deals, setDeals] = useState<DealScore[]>([]);
  const [allStores, setAllStores] = useState<StoreType[]>([]);
  const [facets, setFacets] = useState<SearchResponse['facets'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('score_desc');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  const fetchDeals = async (pageToFetch = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.searchDeals({
        q: searchQuery || undefined,
        categorySlug: selectedCategory || undefined,
        storeSlug: selectedStore || undefined,
        brand: selectedBrand || undefined,
        minScore,
        sortBy,
        minPrice,
        maxPrice,
        page: pageToFetch,
        limit: 40,
      });

      if (append) {
        setDeals((prev) => {
          const existingIds = new Set(prev.map((d) => d.offer.id));
          const newItems = response.data.filter((d) => !existingIds.has(d.offer.id));
          return [...prev, ...newItems];
        });
      } else {
        setDeals(response.data);
      }

      setFacets(response.facets);
      setTotal(response.pagination?.total ?? response.data.length);
      setTotalPages(response.pagination?.totalPages ?? 1);
      setPage(pageToFetch);
    } catch {
      if (!append) {
        setDeals([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    api.getStores().then((stores) => {
      setAllStores(stores);
    });
  }, []);

  useEffect(() => {
    fetchDeals(1, false);
  }, [searchQuery, selectedCategory, selectedStore, minScore, selectedBrand, sortBy, minPrice, maxPrice]);

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchDeals(page + 1, true);
    }
  };

  const resetFilters = () => {
    setMinScore(undefined);
    setSelectedBrand('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSortBy('score_desc');
    if (onSelectStore) {
      onSelectStore('');
    }
    if (onSelectCategory) {
      onSelectCategory('');
    }
  };

  const hasActiveFilters =
    minScore !== undefined ||
    selectedBrand !== '' ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    selectedStore !== '' ||
    Boolean(selectedCategory);

  const getActiveStoreName = () => {
    if (!selectedStore) return '';
    const match = allStores.find((s) => s.slug === selectedStore);
    return match ? match.name : selectedStore;
  };

  const topStores = allStores.filter((s) => (s.offerCount || 0) > 0).slice(0, 8);
  const otherStores = allStores.filter((s) => !topStores.some((ts) => ts.slug === s.slug));
  const isSelectedStoreInOther = selectedStore && otherStores.some((s) => s.slug === selectedStore);
  const totalCatalogOffers = allStores.reduce((sum, s) => sum + (s.offerCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Official Stores Showcase (Conoce nuestras tiendas oficiales) */}
      <StoreShowcase
        selectedStore={selectedStore}
        onSelectStore={onSelectStore || (() => {})}
        stores={allStores}
      />

      {/* Modern Structured Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-2xs">
        {/* Tier 1: Store Selector (Pills + Grouped Dropdown) */}
        <div className="space-y-2 pb-3 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                <Store className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Filtrar por Tienda:
              </span>
            </div>

            {/* Quick Pills for stores ordered by offer count */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {/* All stores pill */}
              <button
                key="all"
                onClick={() => onSelectStore && onSelectStore('')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  !selectedStore
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Todas</span>
                {totalCatalogOffers > 0 && (
                  <span className={`text-[10px] ${!selectedStore ? 'text-slate-300 font-normal' : 'text-slate-400 font-normal'}`}>
                    ({totalCatalogOffers.toLocaleString()})
                  </span>
                )}
              </button>

              {/* Dynamic top stores with offer counts */}
              {topStores.map((st) => {
                const isSelected = selectedStore === st.slug;
                const cleanName = st.name
                  .replace(' México', '')
                  .replace(' Oficial', '')
                  .replace(' Store', '');

                return (
                  <button
                    key={st.slug}
                    onClick={() => onSelectStore && onSelectStore(isSelected ? '' : st.slug)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cleanName}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-slate-300 font-normal' : 'text-slate-400 font-normal'}`}>
                      ({(st.offerCount || 0).toLocaleString()})
                    </span>
                  </button>
                );
              })}

              {/* If selected store is from dropdown, show it as an active pill */}
              {isSelectedStoreInOther && (
                <button
                  onClick={() => onSelectStore && onSelectStore('')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 text-white shrink-0 whitespace-nowrap"
                  title="Quitar filtro de tienda"
                >
                  <span>{getActiveStoreName()}</span>
                  <span className="text-[10px] text-slate-300 font-normal">
                    ({allStores.find((s) => s.slug === selectedStore)?.offerCount || 0})
                  </span>
                  <X className="w-3 h-3 text-slate-400 hover:text-white" />
                </button>
              )}

              {/* Dropdown for remaining stores with real offer counts */}
              {otherStores.length > 0 && (
                <select
                  value={isSelectedStoreInOther ? selectedStore : ''}
                  onChange={(e) => onSelectStore && onSelectStore(e.target.value)}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shrink-0"
                >
                  <option value="">Más tiendas ({otherStores.length})...</option>
                  {otherStores.map((st) => (
                    <option key={st.slug} value={st.slug}>
                      {st.name} ({st.offerCount || 0} ofertas)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Tier 2: Refinements & Sorting */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Quality Deal Score & Brand Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Deal Score Quality Pills with Lucide Icons (Zero Emojis) */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 font-medium mr-1">Calidad:</span>
              <button
                onClick={() => setMinScore(undefined)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  minScore === undefined
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Todas</span>
              </button>

              <button
                onClick={() => setMinScore(70)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
                  minScore === 70
                    ? 'bg-sky-100 text-sky-900 border-sky-300 font-bold'
                    : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-sky-600" />
                <span>Buenas (&ge;70 pts)</span>
              </button>

              <button
                onClick={() => setMinScore(85)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
                  minScore === 85
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Award className="w-3 h-3 text-emerald-600" />
                <span>Super Deals (&ge;85 pts)</span>
              </button>
            </div>

            {/* Brand Filter */}
            {facets?.brands && facets.brands.length > 0 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">Todas las marcas</option>
                  {facets.brands.slice(0, 20).map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} ({b.count})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: Price Range & Sort */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Price Inputs */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">Precio MXN:</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice ?? ''}
                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                className="w-16 px-1.5 py-0.5 rounded border border-slate-200 text-xs bg-white focus:outline-none text-center font-medium"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice ?? ''}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                className="w-16 px-1.5 py-0.5 rounded border border-slate-200 text-xs bg-white focus:outline-none text-center font-medium"
              />
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-white focus:outline-none cursor-pointer"
              >
                <option value="score_desc">Mejor Calificación</option>
                <option value="discount_desc">Mayor Descuento (%)</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
                <option value="newest">Más Recientes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tier 3: Active Filters & Results summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900">
              {loading
                ? 'Consultando tiendas oficiales...'
                : total > deals.length
                ? `Mostrando ${deals.length} de ${total} ofertas disponibles`
                : `${deals.length} ofertas disponibles`}
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                Búsqueda: &quot;{searchQuery}&quot;
              </span>
            )}

            {selectedCategory && (
              <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 px-2 py-0.5 rounded font-medium border border-stone-200">
                Categoría: {selectedCategory.replace(/-/g, ' ')}
                <button
                  onClick={() => onSelectCategory && onSelectCategory('')}
                  className="hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStore && (
              <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 px-2 py-0.5 rounded font-medium border border-stone-200">
                Tienda: {getActiveStoreName()}
                <button
                  onClick={() => onSelectStore && onSelectStore('')}
                  className="hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {minScore && (
              <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 px-2 py-0.5 rounded font-medium border border-sky-200">
                Calidad: &ge;{minScore} pts
                <button onClick={() => setMinScore(undefined)} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedBrand && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-200">
                Marca: {selectedBrand}
                <button onClick={() => setSelectedBrand('')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(minPrice !== undefined || maxPrice !== undefined) && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                Precio: ${minPrice ?? 0} - ${maxPrice ?? '∞'} MXN
                <button
                  onClick={() => {
                    setMinPrice(undefined);
                    setMaxPrice(undefined);
                  }}
                  className="hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-rose-700 hover:text-rose-800 font-semibold transition-colors"
            >
              <RefreshCcw className="w-3 h-3" />
              <span>Restablecer todo</span>
            </button>
          )}
        </div>
      </div>

      {/* Dedicated Brand Showcase Section with Official Logos & Offer Counters */}
      <BrandShowcase
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        brandFacets={facets?.brands}
      />

      {/* Main Full-Width Cards Grid */}
      <main>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-slate-200 p-4 h-80 animate-pulse" />
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hay ofertas activas que coincidan con estos filtros. Intenta ampliar el rango de precios o seleccionar otra categoría.
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Restablecer Filtros</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {deals.map((deal) => (
                <DealCard
                  key={deal.offer.id}
                  deal={deal}
                  onOpenHistory={onOpenHistory}
                  onOpenAlert={onOpenAlert}
                  isFavorite={isFavorite ? isFavorite(deal.offer.id) : false}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>

            {/* Pagination / Load More Button */}
            {deals.length < total && (
              <div className="pt-6 pb-2 flex flex-col items-center justify-center space-y-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Cargando ofertas adicionales...</span>
                    </>
                  ) : (
                    <>
                      <span>Cargar más ofertas ({total - deals.length} restantes)</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 font-medium">
                  Mostrando {deals.length} de {total} ofertas en catálogo
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
