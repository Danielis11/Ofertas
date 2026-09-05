import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MobileDeal } from '../api/client';
import { DealScoreGauge } from './DealScoreGauge';

interface Props {
  deal: MobileDeal;
  onAlertPress: (deal: MobileDeal) => void;
}

export const DealItem: React.FC<Props> = ({ deal, onAlertPress }) => {
  const { offer, score, grade, savingsPercentage } = deal;
  const product = offer.product;
  const store = offer.store;

  const formattedPrice = `$${Number(offer.price).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.storeBadge}>
          <Text style={styles.storeText}>{store?.name || 'Tienda'}</Text>
        </View>
        {savingsPercentage > 0 && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>-{savingsPercentage}% ahorro</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {product?.image ? (
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Text style={styles.noImageText}>Sin foto</Text>
          </View>
        )}

        <View style={styles.info}>
          {product?.brand && <Text style={styles.brand}>{product.brand}</Text>}
          <Text style={styles.title} numberOfLines={2}>
            {product?.name || 'Producto en oferta'}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formattedPrice} MXN</Text>
            <DealScoreGauge score={score} grade={grade} />
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.alertButton} onPress={() => onAlertPress(deal)}>
          <Text style={styles.alertButtonText}>🔔 Crear Alerta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => Linking.openURL(offer.url)}
        >
          <Text style={styles.buyButtonText}>Ver en Tienda →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  storeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  storeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  savingsBadge: {
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
  body: {
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ea580c',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginVertical: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  buyButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ea580c',
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
