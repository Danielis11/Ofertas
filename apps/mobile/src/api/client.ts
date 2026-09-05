import { Platform } from 'react-native';

const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api/v1',
  ios: 'http://localhost:3000/api/v1',
  default: 'http://localhost:3000/api/v1',
});

export interface MobileDeal {
  score: number;
  grade: string;
  savingsPercentage: number;
  factors: {
    discountFromAverage: number;
    discountFromHistoricalMax: number;
    isHistoricalLowest: boolean;
    crossStoreAdvantage: number;
  };
  offer: {
    id: string;
    price: string | number;
    currency: string;
    url: string;
    product?: {
      id: string;
      name: string;
      brand: string;
      image?: string;
    };
    store?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export const mobileApi = {
  async getTopDeals(minScore = 50, limit = 20): Promise<MobileDeal[]> {
    try {
      const res = await fetch(`${BASE_URL}/deals/top?minScore=${minScore}&limit=${limit}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn('Error fetching mobile deals:', e);
      return [];
    }
  },

  async searchDeals(query: string, storeSlug?: string): Promise<MobileDeal[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (storeSlug) params.append('storeSlug', storeSlug);

      const res = await fetch(`${BASE_URL}/search?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.warn('Error searching mobile deals:', e);
      return [];
    }
  },

  async getPriceStatistics(offerId: string) {
    try {
      const res = await fetch(`${BASE_URL}/prices/offer/${offerId}/statistics`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createPriceAlert(productId: string, targetPrice: number) {
    try {
      const res = await fetch(`${BASE_URL}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, targetPrice, notifyChannels: ['PUSH', 'IN_APP'] }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
