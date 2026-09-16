import { useAuth } from '@/src/contexts/AuthContext';
import { useCart } from '@/src/contexts/CartContext';
import type { CartItem } from '@/src/types';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function CartItemRow({ item }: { item: CartItem }) {
  const { updateItem, removeItem } = useCart();

  const handleRemove = () => {
    Alert.alert('Remover item', `Remover "${item.name}" do carrinho?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => void removeItem(item.variantId),
      },
    ]);
  };

  const handleQtyChange = (delta: number) => {
    const next = item.quantity + delta;
    if (next < 1) {
      handleRemove();
    } else {
      void updateItem(item.variantId, next);
    }
  };

  return (
    <View style={styles.itemRow}>
      <View style={[styles.itemImage, styles.imagePlaceholder]}>
        <Text>📦</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemAttrs}>{item.sku}</Text>
        <Text style={styles.itemPrice}>R$ {item.unitPrice.toFixed(2)} cada</Text>
        <View style={styles.qtyRow}>
          <Pressable style={styles.qtyBtn} onPress={() => handleQtyChange(-1)}>
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <Text style={styles.qty}>{item.quantity}</Text>
          <Pressable style={styles.qtyBtn} onPress={() => handleQtyChange(1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
          <Pressable style={styles.removeBtn} onPress={handleRemove}>
            <Text style={styles.removeBtnText}>🗑</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.itemTotal}>R$ {item.subtotal.toFixed(2)}</Text>
    </View>
  );
}

export default function CartScreen() {
  const { isAuthenticated } = useAuth();
  const { cart, itemCount, isLoading, clearCart } = useCart();

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>🛒 Seu carrinho</Text>
          <Text style={styles.emptyText}>
            Faça login para adicionar produtos ao carrinho.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/auth/login')}>
            <Text style={styles.primaryBtnText}>Entrar</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.secondaryBtnText}>Criar conta</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 80 }} size="large" color="#2B6CB0" />
      </SafeAreaView>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  if (isEmpty) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>🛒 Carrinho vazio</Text>
          <Text style={styles.emptyText}>Adicione produtos para continuar.</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/products')}>
            <Text style={styles.primaryBtnText}>Ver produtos</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleClear = () => {
    Alert.alert('Limpar carrinho', 'Remover todos os itens?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => void clearCart() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carrinho ({itemCount})</Text>
        <Pressable onPress={handleClear}>
          <Text style={styles.clearText}>Limpar</Text>
        </Pressable>
      </View>

      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <CartItemRow item={item} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {cart.total.toFixed(2)}</Text>
        </View>
        <Pressable style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutBtnText}>Finalizar compra</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
  clearText: { color: '#E53E3E', fontWeight: '600' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#2D3748', marginBottom: 8 },
  emptyText: { color: '#718096', textAlign: 'center', marginBottom: 24 },
  primaryBtn: {
    backgroundColor: '#2B6CB0',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#2B6CB0',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#2B6CB0', fontWeight: '700', fontSize: 16 },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    alignItems: 'flex-start',
  },
  itemImage: { width: 72, height: 72, borderRadius: 8, marginRight: 12 },
  imagePlaceholder: {
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#2D3748', marginBottom: 2 },
  itemAttrs: { fontSize: 11, color: '#718096', marginBottom: 4 },
  itemPrice: { fontSize: 12, color: '#4A5568', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    backgroundColor: '#EDF2F7',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
  qty: { fontSize: 15, fontWeight: '600', color: '#2D3748', minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: 8 },
  removeBtnText: { fontSize: 18 },
  itemTotal: { fontSize: 15, fontWeight: 'bold', color: '#2B6CB0', marginLeft: 8 },
  separator: { height: 1, backgroundColor: '#E2E8F0' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    paddingBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 16, color: '#2D3748' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
  checkoutBtn: {
    backgroundColor: '#2B6CB0',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
