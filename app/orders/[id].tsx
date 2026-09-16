import { ordersApi } from '@/src/api/orders';
import { useAuth } from '@/src/contexts/AuthContext';
import { useCart } from '@/src/contexts/CartContext';
import type { Order, OrderTimeline } from '@/src/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

const STATUS_LABELS: Record<string, string> = {
  PENDING: '⏳ Pendente',
  PAID: '✅ Pago',
  CANCELLED: '❌ Cancelado',
  REFUNDED: '↩️ Reembolsado',
  PROCESSING: '⚙️ Em processamento',
  SHIPPED: '🚚 Enviado',
  DELIVERED: '📬 Entregue',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#D69E2E',
  PAID: '#38A169',
  CANCELLED: '#E53E3E',
  REFUNDED: '#718096',
  PROCESSING: '#2B6CB0',
  SHIPPED: '#2B6CB0',
  DELIVERED: '#38A169',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { refresh: refreshCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCanclling] = useState(false);
  const [reordering, setReordering] = useState(false);

  const fetchOrder = async () => {
    if (!id || !token) return;
    try {
      const [o, t] = await Promise.all([
        ordersApi.getById(id, token),
        ordersApi.getTimeline(id, token),
      ]);
      setOrder(o);
      setTimeline(t);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o pedido.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const handleCancel = () => {
    Alert.alert('Cancelar pedido', 'Deseja cancelar este pedido?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          if (!token || !id) return;
          setCanclling(true);
          try {
            await ordersApi.cancel(id, token);
            await fetchOrder();
          } catch (e) {
            Alert.alert('Erro', (e as Error).message);
          } finally {
            setCanclling(false);
          }
        },
      },
    ]);
  };

  const handleReorder = async () => {
    if (!token || !id) return;
    Alert.alert('Repetir pedido', 'Adicionar os itens ao carrinho?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim',
        onPress: async () => {
          setReordering(true);
          try {
            await ordersApi.reorder(id, token);
            await refreshCart();
            Alert.alert('✅ Pronto!', 'Itens adicionados ao carrinho.', [
              { text: 'Ver carrinho', onPress: () => router.push('/cart') },
              { text: 'OK' },
            ]);
          } catch (e) {
            Alert.alert('Erro', (e as Error).message);
          } finally {
            setReordering(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 80 }} size="large" color="#2B6CB0" />
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const canCancel = order.status === 'PENDING';
  const canReorder = ['PAID', 'DELIVERED', 'CANCELLED'].includes(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={order.items}
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
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={
          <>
            {/* Order info */}
            <View style={styles.orderCard}>
              <Text style={styles.orderId}>
                Pedido #{order.id.slice(-8).toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.orderStatus,
                  { color: STATUS_COLORS[order.status] ?? '#718096' },
                ]}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </Text>
              <Text style={styles.orderDate}>
                Criado em:{' '}
                {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.orderTotal}>Total: R$ {order.total.toFixed(2)}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              {canCancel && (
                <Pressable
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <ActivityIndicator color="#E53E3E" />
                  ) : (
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  )}
                </Pressable>
              )}
              {canReorder && (
                <Pressable
                  style={[styles.actionBtn, styles.reorderBtn]}
                  onPress={handleReorder}
                  disabled={reordering}
                >
                  {reordering ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.reorderBtnText}>Repetir pedido</Text>
                  )}
                </Pressable>
              )}
            </View>

            {/* Timeline */}
            {timeline.length > 0 && (
              <View style={styles.timelineSection}>
                <Text style={styles.sectionTitle}>Histórico</Text>
                {timeline.map((t) => (
                  <View key={t.id} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View>
                      <Text style={styles.timelineStatus}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </Text>
                      <Text style={styles.timelineDate}>
                        {new Date(t.createdAt).toLocaleString('pt-BR')}
                      </Text>
                      {t.note && <Text style={styles.timelineNote}>{t.note}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Itens</Text>
          </>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  orderCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  orderStatus: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  orderDate: { fontSize: 12, color: '#718096', marginBottom: 6 },
  orderTotal: { fontSize: 18, fontWeight: 'bold', color: '#2B6CB0' },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  cancelBtn: { borderWidth: 1.5, borderColor: '#E53E3E' },
  cancelBtnText: { color: '#E53E3E', fontWeight: '700' },
  reorderBtn: { backgroundColor: '#2B6CB0' },
  reorderBtnText: { color: '#fff', fontWeight: '700' },
  timelineSection: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3748',
    marginLeft: 16,
    marginBottom: 8,
  },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2B6CB0',
    marginTop: 4,
  },
  timelineStatus: { fontSize: 13, fontWeight: '600', color: '#2D3748' },
  timelineDate: { fontSize: 11, color: '#718096' },
  timelineNote: { fontSize: 12, color: '#4A5568', marginTop: 2 },
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
  sep: { height: 1, backgroundColor: '#E2E8F0' },
});
