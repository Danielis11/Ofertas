'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroBanner } from '../components/HeroBanner';
import { PersonalizedFeed } from '../components/PersonalizedFeed';
import { CategoryChips } from '../components/CategoryChips';
import { DealsExplorer } from '../components/DealsExplorer';
import { PriceHistoryModal } from '../components/PriceHistoryModal';
import { AlertModal } from '../components/AlertModal';
import { DispatcherModal } from '../components/DispatcherModal';
import { DealScore } from '../lib/api';
import { useUserIntent } from '../lib/useUserIntent';
import { Flame, Heart } from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [activeHistoryDeal, setActiveHistoryDeal] = useState<DealScore | null>(null);
  const [activeAlertDeal, setActiveAlertDeal] = useState<DealScore | null>(null);
  const [isDispatcherOpen, setIsDispatcherOpen] = useState(false);

  const { recentIntent, trackQuery, clearIntent } = useUserIntent();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 3) {
      trackQuery(query);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedStore={selectedStore}
        onSelectStore={setSelectedStore}
        onOpenDispatcher={() => setIsDispatcherOpen(true)}
      />

      {/* Multi-Category Quick Filter Chips */}
      <CategoryChips
        activeCategory={searchQuery}
        onSelectCategory={handleSearchChange}
      />

      {/* Hero */}
      {!searchQuery && !selectedStore && <HeroBanner />}

      {/* Personalized Recommendations based on recent search intent (e.g., Running) */}
      {!searchQuery && !selectedStore && recentIntent && (
        <PersonalizedFeed
          intent={recentIntent}
          onOpenHistory={(deal) => setActiveHistoryDeal(deal)}
          onOpenAlert={(deal) => setActiveAlertDeal(deal)}
          onDismiss={clearIntent}
        />
      )}

      {/* Explorer */}
      <DealsExplorer
        searchQuery={searchQuery}
        selectedStore={selectedStore}
        onOpenHistory={(deal) => setActiveHistoryDeal(deal)}
        onOpenAlert={(deal) => setActiveAlertDeal(deal)}
      />

      {/* Modals */}
      <PriceHistoryModal
        deal={activeHistoryDeal}
        onClose={() => setActiveHistoryDeal(null)}
        onOpenAlert={(deal) => {
          setActiveHistoryDeal(null);
          setActiveAlertDeal(deal);
        }}
      />

      <AlertModal
        deal={activeAlertDeal}
        onClose={() => setActiveAlertDeal(null)}
      />

      <DispatcherModal
        isOpen={isDispatcherOpen}
        onClose={() => setIsDispatcherOpen(false)}
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

          <p className="text-xs text-slate-500 flex items-center gap-1">
            Diseñado y optimizado con arquitectura de microservicios, NestJS, RabbitMQ, Redis y Next.js.
          </p>
        </div>
      </footer>
    </div>
  );
}
