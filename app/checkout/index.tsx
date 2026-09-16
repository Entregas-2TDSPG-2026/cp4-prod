import { ApiException } from '@/src/api/client';
import { ordersApi } from '@/src/api/orders';
import { useAuth } from '@/src/contexts/AuthContext';
import { useCart } from '@/src/contexts/CartContext';
import type { Order } from '@/src/types';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

export default function CheckoutScreen() {
  const { token } = useAuth();
  const { cart, refresh } = useCart();
  const [loading, setLoading] = useState(false);

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
          <Pressable onPress={() => router.replace('/products')}>
            <Text style={styles.linkText}>Ver produtos</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleCheckout = async () => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    try {
      const order: Order = await ordersApi.checkout(token);
      await refresh(); // cart is now empty
      router.replace(`/checkout/payment?orderId=${order.id}&total=${order.total}`);
    } catch (e) {
      const msg =
        e instanceof ApiException ? e.message : 'Erro ao criar pedido. Tente novamente.';
      Alert.alert('Erro no checkout', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Resumo do pedido</Text>

      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product.name}
              </Text>
              {item.variant.attributes.length > 0 && (
                <Text style={styles.itemAttrs}>
                  {item.variant.attributes.map((a) => `${a.name}: ${a.value}`).join(' · ')}
                </Text>
              )}
              <Text style={styles.itemQty}>Qtd: {item.quantity}</Text>
            </View>
            <Text style={styles.itemTotal}>R$ {item.totalPrice.toFixed(2)}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.row}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>R$ {cart.subtotal.toFixed(2)}</Text>
        </View>
        <View style={[styles.row, { marginTop: 4 }]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {cart.total.toFixed(2)}</Text>
        </View>
        <Pressable
          style={[styles.checkoutBtn, loading && styles.btnDisabled]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutBtnText}>Confirmar pedido</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#718096', marginBottom: 12 },
  linkText: { color: '#2B6CB0', fontWeight: '600' },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 14,
    alignItems: 'flex-start',
  },
  itemName: { fontSize: 14, fontWeight: '600', color: '#2D3748', marginBottom: 2 },
  itemAttrs: { fontSize: 11, color: '#718096', marginBottom: 4 },
  itemQty: { fontSize: 12, color: '#4A5568' },
  itemTotal: { fontSize: 14, fontWeight: 'bold', color: '#2B6CB0', marginLeft: 8 },
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
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  subtotalLabel: { color: '#718096' },
  subtotalValue: { color: '#718096' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
  checkoutBtn: {
    backgroundColor: '#2B6CB0',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
