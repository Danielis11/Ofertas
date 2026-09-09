import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CategoryChips } from './components/CategoryChips';
import { HeroBanner } from './components/HeroBanner';
import { PersonalizedFeed } from './components/PersonalizedFeed';
import { DealsExplorer } from './components/DealsExplorer';
import { PriceHistoryModal } from './components/PriceHistoryModal';
import { AlertModal } from './components/AlertModal';
import { DispatcherModal } from './components/DispatcherModal';
import { LiveDealToast } from './components/LiveDealToast';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { useLiveDeals } from './lib/useLiveDeals';
import { useUserIntent } from './lib/useUserIntent';
import { useFavorites } from './lib/useFavorites';
import { useNotifications } from './lib/useNotifications';
import { DealScore } from './lib/api';
import { Flame, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [activeHistoryDeal, setActiveHistoryDeal] = useState<DealScore | null>(null);
  const [activeAlertDeal, setActiveAlertDeal] = useState<DealScore | null>(null);
  const [isDispatcherOpen, setIsDispatcherOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  // User Search Intent & Personalization Hook
  const { recentIntent, trackQuery, clearIntent } = useUserIntent();

  // Favorites Hook (Local persistence)
  const {
    favorites,
    favoritesCount,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
  } = useFavorites();

  // Track search query changes for returning user recommendations
  useEffect(() => {
    if (searchQuery) {
      trackQuery(searchQuery);
    }
  }, [searchQuery, trackQuery]);

  // WebSocket Live Stream Hook
  const { isConnected, latestLiveEvent, dismissEvent } = useLiveDeals();

  // In-app & Desktop Notifications Hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll: clearNotifications,
    hasDesktopPermission,
    requestDesktopPermission,
  } = useNotifications(latestLiveEvent);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q) setSelectedCategory('');
        }}
        selectedStore={selectedStore}
        onSelectStore={setSelectedStore}
        onOpenDispatcher={() => setIsDispatcherOpen(true)}
        isConnected={isConnected}
        favoritesCount={favoritesCount}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearNotifications={clearNotifications}
        hasDesktopPermission={hasDesktopPermission}
        onRequestDesktopPermission={requestDesktopPermission}
        onSelectNotificationDeal={(dealId) => {
          const found = favorites.find((f) => f.offer.id === dealId || f.offer.productId === dealId);
          if (found) setActiveHistoryDeal(found);
        }}
      />

      {/* Category Chips Bar */}
      <CategoryChips
        activeCategory={selectedCategory}
        onSelectCategory={(slug) => {
          setSelectedCategory(slug);
          setSearchQuery('');
        }}
      />

      {/* Hero */}
      {!searchQuery && !selectedStore && !selectedCategory && <HeroBanner />}

      {/* Personalized Intent-Based Feed (Shows when user returns home after searching) */}
      {!searchQuery && !selectedStore && !selectedCategory && recentIntent && (
        <PersonalizedFeed
          intent={recentIntent}
          onOpenHistory={(deal) => setActiveHistoryDeal(deal)}
          onOpenAlert={(deal) => setActiveAlertDeal(deal)}
          onDismiss={clearIntent}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Main Deals Explorer */}
      <DealsExplorer
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedStore={selectedStore}
        onSelectStore={setSelectedStore}
        onOpenHistory={(deal) => setActiveHistoryDeal(deal)}
        onOpenAlert={(deal) => setActiveAlertDeal(deal)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />

      {/* Modals */}
      <PriceHistoryModal
        deal={activeHistoryDeal}
        onClose={() => setActiveHistoryDeal(null)}
        onOpenAlert={(deal) => {
          setActiveHistoryDeal(null);
          setActiveAlertDeal(deal);
        }}
        isFavorite={activeHistoryDeal ? isFavorite(activeHistoryDeal.offer.id) : false}
        onToggleFavorite={toggleFavorite}
      />

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onRemoveFavorite={removeFavorite}
        onClearFavorites={clearFavorites}
        onOpenHistory={(deal) => setActiveHistoryDeal(deal)}
      />

      <AlertModal
        deal={activeAlertDeal}
        onClose={() => setActiveAlertDeal(null)}
      />

      <DispatcherModal
        isOpen={isDispatcherOpen}
        onClose={() => setIsDispatcherOpen(false)}
      />

      {/* Floating Live Deal Alert */}
      <LiveDealToast
        event={latestLiveEvent}
        onDismiss={dismissEvent}
      />

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">DealHunter Platform</span>
            <span className="text-xs text-slate-400">© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> RabbitMQ Real-Time Bus
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Algorithmic Deal Scoring
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
