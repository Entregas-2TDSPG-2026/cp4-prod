import { productsApi } from '@/src/api/products';
import type { ProductListItem } from '@/src/types';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 20;

function ProductCard({ item }: { item: ProductListItem }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/products/${item.id}`)}
    >
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.placeholder]}>
          <Text style={{ fontSize: 32 }}>📦</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cardPrice}>
          {item.priceFrom === item.priceTo
            ? `R$ ${item.priceFrom.toFixed(2)}`
            : `R$ ${item.priceFrom.toFixed(2)} ~ ${item.priceTo.toFixed(2)}`}
        </Text>
        <Text style={styles.cardStock}>
          {item.stock > 0 ? `${item.stock} em estoque` : 'Indisponível'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ProductsScreen() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(
    async (searchTerm: string, nextPage: number, append: boolean) => {
      if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const res = await productsApi.list({
          search: searchTerm || undefined,
          page: nextPage,
          pageSize: PAGE_SIZE,
        });
        setTotal(res.total);
        setProducts(append ? (prev) => [...prev, ...res.data] : res.data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchProducts('', 1, false);
  }, [fetchProducts]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      void fetchProducts(text, 1, false);
    }, 400);
  };

  const loadMore = () => {
    if (loadingMore || products.length >= total) return;
    const next = page + 1;
    setPage(next);
    void fetchProducts(search, next, true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Produtos</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos..."
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#2B6CB0" />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => fetchProducts(search, 1, false)}>
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color="#2B6CB0" style={{ marginVertical: 12 }} />
            ) : (
              <View style={{ height: 24 }} />
            )
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
            </View>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A202C', marginBottom: 8 },
  searchInput: {
    backgroundColor: '#EDF2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    color: '#2D3748',
  },
  list: { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 24 },
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
  placeholder: { backgroundColor: '#EDF2F7', justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 10 },
  cardName: { fontSize: 13, color: '#2D3748', fontWeight: '600', marginBottom: 4 },
  cardPrice: { fontSize: 14, color: '#2B6CB0', fontWeight: 'bold', marginBottom: 2 },
  cardStock: { fontSize: 11, color: '#718096' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  errorText: { color: '#E53E3E', textAlign: 'center', marginBottom: 12 },
  retryText: { color: '#2B6CB0', fontWeight: '600' },
  emptyText: { color: '#718096', fontSize: 15 },
});
