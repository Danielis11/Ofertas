import React, { useState, useEffect, useRef } from 'react';
import { Search, Flame, Bell, Cpu, ArrowRight, X, Tag, Folder, Heart } from 'lucide-react';
import { api, SuggestionsResponse } from '../lib/api';
import { AppNotification } from '../lib/useNotifications';
import { NotificationsDropdown } from './NotificationsDropdown';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenDispatcher: () => void;
  selectedStore: string;
  onSelectStore: (slug: string) => void;
  isConnected?: boolean;
  favoritesCount?: number;
  onOpenFavorites?: () => void;
  notifications?: AppNotification[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearNotifications?: () => void;
  hasDesktopPermission?: boolean;
  onRequestDesktopPermission?: () => Promise<boolean>;
  onSelectNotificationDeal?: (dealId: string) => void;
}

export const Navbar: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onOpenDispatcher,
  selectedStore,
  onSelectStore,
  isConnected = false,
  favoritesCount = 0,
  onOpenFavorites,
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  hasDesktopPermission = false,
  onRequestDesktopPermission,
  onSelectNotificationDeal,
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<SuggestionsResponse>({ products: [], brands: [], categories: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceSearchRef = useRef<NodeJS.Timeout | null>(null);

  // Keep input value in sync when external filters or category chips change searchQuery
  useEffect(() => {
    setInputValue(searchQuery || '');
  }, [searchQuery]);

  // Click outside and escape key listener to cleanly close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fetch autocomplete suggestions + auto-apply search with debounce
  useEffect(() => {
    const trimmed = inputValue.trim();

    // If input is cleared, immediately clear search results
    if (!inputValue) {
      setSuggestions({ products: [], brands: [], categories: [] });
      setShowDropdown(false);
      if (searchQuery !== '') {
        onSearchChange('');
      }
      return;
    }

    // Debounced suggestion fetching
    const suggestionsTimer = setTimeout(() => {
      if (trimmed.length >= 2) {
        api.getSuggestions(trimmed).then((res) => {
          setSuggestions(res);
          const hasAny = (res.products?.length || 0) > 0 || (res.brands?.length || 0) > 0 || (res.categories?.length || 0) > 0;
          setShowDropdown(hasAny);
        }).catch(() => {
          setSuggestions({ products: [], brands: [], categories: [] });
        });
      }
    }, 200);

    // Debounced automatic search execution (ensures search is saved/applied even if user does not hit enter)
    if (debounceSearchRef.current) {
      clearTimeout(debounceSearchRef.current);
    }
    debounceSearchRef.current = setTimeout(() => {
      if (trimmed !== searchQuery) {
        onSearchChange(trimmed);
      }
    }, 450);

    return () => {
      clearTimeout(suggestionsTimer);
      if (debounceSearchRef.current) {
        clearTimeout(debounceSearchRef.current);
      }
    };
  }, [inputValue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceSearchRef.current) {
      clearTimeout(debounceSearchRef.current);
    }
    setShowDropdown(false);
    onSearchChange(inputValue.trim());
  };

  const selectSuggestion = (term: string) => {
    if (debounceSearchRef.current) {
      clearTimeout(debounceSearchRef.current);
    }
    setInputValue(term);
    setShowDropdown(false);
    onSearchChange(term.trim());
  };

  const handleClear = () => {
    if (debounceSearchRef.current) {
      clearTimeout(debounceSearchRef.current);
    }
    setInputValue('');
    setShowDropdown(false);
    onSearchChange('');
  };

  const hasSuggestions =
    (suggestions.brands?.length || 0) > 0 ||
    (suggestions.categories?.length || 0) > 0 ||
    (suggestions.products?.length || 0) > 0;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo: Clean Solid Minimalist */}
          <div
            className="flex items-center gap-2.5 shrink-0 cursor-pointer select-none"
            onClick={() => {
              handleClear();
              onSelectStore('');
            }}
          >
            <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center text-white">
              <Flame className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <span className="text-base font-black text-stone-900 tracking-tight block leading-none">
                DealHunter
              </span>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mt-0.5">
                Precios Oficiales México
              </span>
            </div>
          </div>

          {/* Search Bar with Autocomplete */}
          <div className="flex-1 max-w-xl relative" ref={dropdownRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => {
                  if (hasSuggestions) setShowDropdown(true);
                }}
                placeholder="Busca cualquier producto (ej. S23, iPhone, Tenis, Pantalón, Licuadora)..."
                className="w-full pl-10 pr-24 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

              {/* Clear button */}
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-20 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                  title="Borrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Buscar
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showDropdown && hasSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 max-h-[75vh] overflow-y-auto space-y-3">
                {/* Instant Search Option */}
                {inputValue.trim().length > 0 && (
                  <div
                    onClick={() => selectSuggestion(inputValue.trim())}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-800 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                    <span>Buscar todo para: <strong className="text-slate-900">&quot;{inputValue.trim()}&quot;</strong></span>
                  </div>
                )}

                {/* Categories */}
                {suggestions.categories && suggestions.categories.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Categorías
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.categories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectSuggestion(c.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors"
                        >
                          <Folder className="w-3 h-3 text-stone-500" />
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brands suggestions */}
                {suggestions.brands && suggestions.brands.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Marcas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.brands.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => selectSuggestion(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wide transition-colors"
                        >
                          <Tag className="w-3 h-3 text-slate-500" />
                          <span>{b}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Suggestions */}
                {suggestions.products && suggestions.products.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Productos
                    </span>
                    <div className="space-y-1">
                      {suggestions.products.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => selectSuggestion(prod.name)}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs group transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-7 h-7 object-contain rounded bg-white shrink-0 border border-slate-100"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                                {prod.brand?.substring(0, 2).toUpperCase() || 'DH'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 group-hover:text-slate-900 block truncate">
                                {prod.name}
                              </span>
                              {prod.brand && (
                                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                                  {prod.brand}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0" />
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
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="hidden sm:inline">{isConnected ? 'En Vivo' : 'Desconectado'}</span>
            </div>

            {/* Favorites Button */}
            {onOpenFavorites && (
              <button
                type="button"
                onClick={onOpenFavorites}
                className="relative p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                title="Mis Me Gusta"
              >
                <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white min-w-4 text-center leading-tight">
                    {favoritesCount}
                  </span>
                )}
              </button>
            )}

            {/* Notifications Button with Dropdown Anchor */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                title="Centro de Notificaciones"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-orange-600 text-white min-w-4 text-center leading-tight">
                    {unreadCount}
                  </span>
                )}
              </button>

              <NotificationsDropdown
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={(id) => {
                  if (onMarkAsRead) onMarkAsRead(id);
                }}
                onMarkAllAsRead={() => {
                  if (onMarkAllAsRead) onMarkAllAsRead();
                }}
                onClearAll={() => {
                  if (onClearNotifications) onClearNotifications();
                }}
                hasDesktopPermission={hasDesktopPermission}
                onRequestDesktopPermission={onRequestDesktopPermission || (async () => false)}
                onSelectNotificationDeal={(dealId) => {
                  setIsNotificationsOpen(false);
                  if (onSelectNotificationDeal) onSelectNotificationDeal(dealId);
                }}
              />
            </div>

            {/* Scraper Panel */}
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
      </div>
    </header>
  );
};
