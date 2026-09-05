const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface DealFactor {
  discountFromAverage: number;
  discountFromHistoricalMax: number;
  isHistoricalLowest: boolean;
  crossStoreAdvantage: number;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo?: string;
  status: string;
}

export interface Product {
  id: string;
  name: string;
  normalizedName: string;
  brand: string;
  model?: string;
  description?: string;
  image?: string;
  categoryId?: string;
}

export interface Offer {
  id: string;
  productId: string;
  storeId: string;
  externalId: string;
  url: string;
  price: string | number;
  currency: string;
  availability: boolean;
  lastSeen: string;
  updatedAt: string;
  product?: Product;
  store?: Store;
}

export interface DealScore {
  score: number;
  grade: 'SUPER_DEAL' | 'GREAT_DEAL' | 'GOOD_DEAL' | 'FAIR' | 'POOR';
  savingsPercentage: number;
  factors: DealFactor;
  offer: Offer;
}

export interface SearchFacets {
  categories: { id: string; name: string; slug: string; count: number }[];
  stores: { id: string; name: string; slug: string; count: number }[];
  brands: { name: string; count: number }[];
  priceRange: { min: number; max: number; avg: number };
}

export interface SearchResponse {
  data: DealScore[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  facets: SearchFacets;
}

export interface PricePoint {
  id: string;
  price: number;
  recordedAt: string;
}

export interface PriceStatistics {
  offerId: string;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  priceDropsCount: number;
  totalDataPoints: number;
}

export interface SuggestionsResponse {
  products: { id: string; name: string; brand: string; image?: string }[];
  brands: string[];
  categories: { id: string; name: string; slug: string }[];
}

export interface ScraperStatus {
  schedulerEnabled: boolean;
  activeSchedules: { name: string; cron: string; targetStore: string; description: string }[];
  totalDispatchedJobs: number;
  lastDispatchedAt?: string;
}

export interface FakeDiscountAnalysis {
  isInflatedOriginalPrice: boolean;
  genuineSavingsPercentage: number;
  advertisedSavingsPercentage: number;
  confidence: 'GENUINE_DEAL' | 'VERIFIED_DROP' | 'SUSPECTED_INFLATION';
  explanation: string;
}

export interface PricePrediction {
  offerId: string;
  currentPrice: number;
  trend: 'UPWARD' | 'DOWNWARD' | 'STABLE';
  predictedNextPrice: number;
  confidenceScore: number;
  recommendation: 'BUY_NOW' | 'WAIT' | 'FAIR_PRICE' | 'OVERPRICED';
  recommendationReason: string;
  fakeDiscountAnalysis: FakeDiscountAnalysis;
}

export const api = {
  // Deals & Search
  async searchDeals(params: Record<string, any> = {}): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const res = await fetch(`${API_BASE_URL}/search?${searchParams.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
    return res.json();
  },

  async getTopDeals(minScore = 70, limit = 12): Promise<DealScore[]> {
    const res = await fetch(`${API_BASE_URL}/deals/top?minScore=${minScore}&limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Failed to fetch top deals: ${res.statusText}`);
    return res.json();
  },

  async getSuggestions(q: string): Promise<SuggestionsResponse> {
    if (!q || q.trim().length === 0) {
      return { products: [], brands: [], categories: [] };
    }
    const res = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(q)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { products: [], brands: [], categories: [] };
    return res.json();
  },

  // Prices & Statistics
  async getPriceHistory(offerId: string): Promise<PricePoint[]> {
    const res = await fetch(`${API_BASE_URL}/prices/offer/${offerId}/history`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Failed to fetch price history`);
    return res.json();
  },

  async getPriceStatistics(offerId: string): Promise<PriceStatistics> {
    const res = await fetch(`${API_BASE_URL}/prices/offer/${offerId}/statistics`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Failed to fetch price statistics`);
    return res.json();
  },

  // Deal Intelligence & Prediction
  async getPrediction(offerId: string): Promise<PricePrediction> {
    const res = await fetch(`${API_BASE_URL}/intelligence/prediction/${offerId}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Failed to fetch prediction`);
    return res.json();
  },

  // Alerts
  async createAlert(token: string, data: { productId: string; targetPrice: number; notifyChannels?: string[] }) {
    const res = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to create alert`);
    return res.json();
  },

  // Scraper Dispatcher
  async getScraperStatus(): Promise<ScraperStatus> {
    const res = await fetch(`${API_BASE_URL}/scraper/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch scraper status');
    return res.json();
  },

  async dispatchScraper(data: { storeSlug: string; searchQuery?: string; category?: string; priority?: string }) {
    const res = await fetch(`${API_BASE_URL}/scraper/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to dispatch scraper');
    return res.json();
  },
};

