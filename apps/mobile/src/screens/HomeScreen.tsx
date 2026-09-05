import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { mobileApi, MobileDeal } from '../api/client';
import { DealItem } from '../components/DealItem';

export const HomeScreen: React.FC = () => {
  const [deals, setDeals] = useState<MobileDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [minScore, setMinScore] = useState<number | undefined>(undefined);

  // Alert modal state
  const [selectedDealForAlert, setSelectedDealForAlert] = useState<MobileDeal | null>(null);
  const [targetPrice, setTargetPrice] = useState('');

  const loadDeals = useCallback(async () => {
    try {
      const data = searchQuery
        ? await mobileApi.searchDeals(searchQuery, selectedStore)
        : await mobileApi.getTopDeals(minScore || 0, 30);

      let filtered = data;
      if (selectedStore) {
        filtered = filtered.filter((d) => d.offer.store?.slug === selectedStore);
      }
      if (minScore) {
        filtered = filtered.filter((d) => d.score >= minScore);
      }
      setDeals(filtered);
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedStore, minScore]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDeals();
  };

  const handleOpenAlert = (deal: MobileDeal) => {
    setSelectedDealForAlert(deal);
    const suggestedPrice = Math.round(Number(deal.offer.price) * 0.9);
    setTargetPrice(String(suggestedPrice));
  };

  const handleSaveAlert = async () => {
    if (!selectedDealForAlert || !targetPrice) return;
    const priceNum = Number(targetPrice);
    const productId = selectedDealForAlert.offer.product?.id || '';

    const success = await mobileApi.createPriceAlert(productId, priceNum);
    if (success) {
      Alert.alert('¡Alerta Creada!', `Te avisaremos por Push cuando baje a $${priceNum} MXN.`);
    } else {
      Alert.alert('Alerta Guardada', 'Alerta registrada para el producto.');
    }
    setSelectedDealForAlert(null);
  };

  const stores = [
    { label: 'Todas', slug: '' },
    { label: 'Amazon MX', slug: 'amazon-mx' },
    { label: 'Mercado Libre', slug: 'mercado-libre-mx' },
    { label: 'Walmart MX', slug: 'walmart-mx' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoFlame}>🔥</Text>
          <View>
            <Text style={styles.logoTitle}>DealHunter</Text>
            <Text style={styles.logoSubtitle}>Radar Móvil de Ofertas</Text>
          </View>
        </View>

        {/* Search Bar */}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto, marca o modelo..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={loadDeals}
        />

        {/* Store Chips */}
        <View style={styles.storeChipsRow}>
          {stores.map((st) => (
            <TouchableOpacity
              key={st.slug}
              style={[
                styles.storeChip,
                selectedStore === st.slug && styles.storeChipActive,
              ]}
              onPress={() => setSelectedStore(st.slug)}
            >
              <Text
                style={[
                  styles.storeChipText,
                  selectedStore === st.slug && styles.storeChipTextActive,
                ]}
              >
                {st.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Score filter chips */}
        <View style={styles.scoreChipsRow}>
          <TouchableOpacity
            style={[styles.scoreChip, minScore === undefined && styles.scoreChipActive]}
            onPress={() => setMinScore(undefined)}
          >
            <Text style={[styles.scoreChipText, minScore === undefined && styles.scoreChipTextActive]}>
              Todos los Scores
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scoreChip, minScore === 70 && styles.scoreChipActiveBlue]}
            onPress={() => setMinScore(70)}
          >
            <Text style={[styles.scoreChipText, minScore === 70 && styles.scoreChipTextActive]}>
              ≥ 70 pts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scoreChip, minScore === 85 && styles.scoreChipActiveGreen]}
            onPress={() => setMinScore(85)}
          >
            <Text style={[styles.scoreChipText, minScore === 85 && styles.scoreChipTextActive]}>
              ≥ 85 Super Deals
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Deals List */}
      <FlatList
        data={deals}
        keyExtractor={(item) => item.offer.id}
        renderItem={({ item }) => <DealItem deal={item} onAlertPress={handleOpenAlert} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No se encontraron ofertas</Text>
              <Text style={styles.emptySubtitle}>Intenta cambiando los filtros o la búsqueda.</Text>
            </View>
          ) : null
        }
      />

      {/* Create Alert Modal */}
      <Modal visible={!!selectedDealForAlert} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔔 Alerta de Precio</Text>
            <Text style={styles.modalProduct}>{selectedDealForAlert?.offer.product?.name}</Text>
            <Text style={styles.modalCurrentPrice}>
              Precio actual: ${Number(selectedDealForAlert?.offer.price || 0)} MXN
            </Text>

            <Text style={styles.modalLabel}>Precio objetivo deseado (MXN):</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={targetPrice}
              onChangeText={setTargetPrice}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSelectedDealForAlert(null)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleSaveAlert}>
                <Text style={styles.modalConfirmText}>Activar Alerta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  logoFlame: {
    fontSize: 28,
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  logoSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ea580c',
    textTransform: 'uppercase',
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 8,
  },
  storeChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  storeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  storeChipActive: {
    backgroundColor: '#ea580c',
  },
  storeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  storeChipTextActive: {
    color: '#ffffff',
  },
  scoreChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scoreChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  scoreChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  scoreChipActiveBlue: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  scoreChipActiveGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  scoreChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  scoreChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  modalProduct: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
  },
  modalCurrentPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ea580c',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
