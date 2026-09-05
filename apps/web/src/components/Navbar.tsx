import React, { useState, useEffect, useRef } from 'react';
import { Search, Flame, Bell, Cpu, ArrowRight, Store } from 'lucide-react';
import { api, SuggestionsResponse } from '../lib/api';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenDispatcher: () => void;
  selectedStore: string;
  onSelectStore: (slug: string) => void;
}

export const Navbar: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onOpenDispatcher,
  selectedStore,
  onSelectStore,
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<SuggestionsResponse>({ products: [], brands: [], categories: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced suggestions lookup
  useEffect(() => {
    if (!inputValue || inputValue.trim().length < 2) {
      setSuggestions({ products: [], brands: [], categories: [] });
      return;
    }

    const timer = setTimeout(() => {
      api.getSuggestions(inputValue).then((res) => {
        setSuggestions(res);
        setShowDropdown(true);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    onSearchChange(inputValue);
  };

  const selectSuggestion = (term: string) => {
    setInputValue(term);
    setShowDropdown(false);
    onSearchChange(term);
  };

  const stores = [
    { name: 'Todas', slug: '' },
    { name: 'Amazon MX', slug: 'amazon-mx' },
    { name: 'Mercado Libre', slug: 'mercado-libre-mx' },
    { name: 'Walmart MX', slug: 'walmart-mx' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => { setInputValue(''); onSearchChange(''); onSelectStore(''); }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight block leading-none">DealHunter</span>
              <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-widest block">Radar de Ofertas</span>
            </div>
          </div>

          {/* Search Bar with Autocomplete */}
          <div className="flex-1 max-w-xl relative" ref={dropdownRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => { if (suggestions.products.length > 0) setShowDropdown(true); }}
                placeholder="Busca por producto, marca o modelo (ej. iPhone, Nintendo, Sony)..."
                className="w-full pl-10 pr-24 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-orange-600 text-white rounded-full text-xs font-semibold hover:bg-orange-700 transition-colors"
              >
                Buscar
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showDropdown && (suggestions.products.length > 0 || suggestions.brands.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50">
                {/* Brands suggestions */}
                {suggestions.brands.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Marcas</span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.brands.map((b) => (
                        <button
                          key={b}
                          onClick={() => selectSuggestion(b)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-xs font-medium transition-colors"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Suggestions */}
                {suggestions.products.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Productos</span>
                    <div className="space-y-1">
                      {suggestions.products.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => selectSuggestion(prod.name)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 group-hover:text-orange-600">{prod.name}</span>
                            <span className="text-[10px] text-slate-400">({prod.brand})</span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-orange-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions & Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDispatcher}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
              title="Panel de Scrapers y Cron Jobs"
            >
              <Cpu className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">Scraper Panel</span>
            </button>
          </div>
        </div>

        {/* Store selector sub-bar */}
        <div className="flex items-center gap-2 py-2 overflow-x-auto border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Store className="w-3.5 h-3.5" /> Tiendas:
          </span>
          {stores.map((st) => (
            <button
              key={st.slug}
              onClick={() => onSelectStore(st.slug)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedStore === st.slug
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
