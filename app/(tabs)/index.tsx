import { productsApi } from '@/src/api/products';
import { useAuth } from '@/src/contexts/AuthContext';
import type { ProductListItem } from '@/src/types';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function ProductCard({ item }: { item: ProductListItem }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/products/${item.id}`)}
    >
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.cardImagePlaceholderText}>📦</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.cardPrice}>
          {item.priceFrom === item.priceTo
            ? `R$ ${item.priceFrom.toFixed(2)}`
            : `A partir de R$ ${item.priceFrom.toFixed(2)}`}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    productsApi
      .list({ pageSize: 10 })
      .then((res) => setProducts(res.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Loja FIAP 🛍️</Text>
          {isAuthenticated && user && (
            <Text style={styles.headerSub}>Olá, {user.name.split(' ')[0]}!</Text>
          )}
        </View>
        {!isAuthenticated && (
          <Pressable onPress={() => router.push('/auth/login')} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>Entrar</Text>
          </Pressable>
        )}
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>🔥 Novidades da semana</Text>
        <Text style={styles.bannerSub}>Confira os produtos em destaque</Text>
      </View>

      {/* Products */}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2B6CB0" />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              setError(null);
              productsApi
                .list({ pageSize: 10 })
                .then((res) => setProducts(res.data))
                .catch((e: Error) => setError(e.message))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <ProductCard item={item} />}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Em destaque</Text>
          }
          ListFooterComponent={
            <Pressable
              style={styles.viewAllBtn}
              onPress={() => router.push('/products')}
            >
              <Text style={styles.viewAllText}>Ver todos os produtos →</Text>
            </Pressable>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
  headerSub: { fontSize: 13, color: '#718096' },
  loginBtn: {
    backgroundColor: '#2B6CB0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginBtnText: { color: '#fff', fontWeight: '600' },
  banner: {
    backgroundColor: '#2B6CB0',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  bannerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  bannerSub: { color: '#BEE3F8', marginTop: 4 },
  loader: { marginTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#E53E3E', textAlign: 'center', marginBottom: 12 },
  retryText: { color: '#2B6CB0', fontWeight: '600' },
  list: { paddingHorizontal: 8, paddingBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginLeft: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 4,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: { width: '100%', height: 130 },
  cardImagePlaceholder: {
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImagePlaceholderText: { fontSize: 36 },
  cardBody: { padding: 10 },
  cardName: { fontSize: 13, color: '#2D3748', fontWeight: '600', marginBottom: 4 },
  cardPrice: { fontSize: 14, color: '#2B6CB0', fontWeight: 'bold' },
  viewAllBtn: {
    alignItems: 'center',
    padding: 16,
    margin: 8,
  },
  viewAllText: { color: '#2B6CB0', fontWeight: '600', fontSize: 15 },
});
