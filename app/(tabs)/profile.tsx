import { ordersApi } from '@/src/api/orders';
import { useAuth } from '@/src/contexts/AuthContext';
import type { Order } from '@/src/types';
import { router } from 'expo-router';
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

function OrderCard({ order }: { order: Order }) {
  return (
    <Pressable
      style={styles.orderCard}
      onPress={() => router.push(`/orders/${order.id}`)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
        <Text style={styles.orderStatus}>{STATUS_LABELS[order.status] ?? order.status}</Text>
      </View>
      <Text style={styles.orderDate}>
        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
      </Text>
      <Text style={styles.orderTotal}>R$ {order.total.toFixed(2)}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, isAuthenticated, token, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    setLoadingOrders(true);
    ordersApi
      .list(token)
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.bigIcon}>👤</Text>
          <Text style={styles.guestTitle}>Área do cliente</Text>
          <Text style={styles.guestText}>
            Faça login para ver seus pedidos e informações.
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

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja deslogar da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        ListHeaderComponent={
          <>
            {/* User card */}
            <View style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user!.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{user!.name}</Text>
                <Text style={styles.userEmail}>{user!.email}</Text>
              </View>
              <Pressable onPress={handleLogout} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Sair</Text>
              </Pressable>
            </View>

            {/* Orders section header */}
            <Text style={styles.sectionTitle}>Meus pedidos</Text>
            {loadingOrders && (
              <ActivityIndicator color="#2B6CB0" style={{ marginVertical: 20 }} />
            )}
          </>
        }
        ListEmptyComponent={
          !loadingOrders ? (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyText}>Você ainda não fez nenhum pedido.</Text>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => router.push('/products')}
              >
                <Text style={styles.primaryBtnText}>Comprar agora</Text>
              </Pressable>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  bigIcon: { fontSize: 56, marginBottom: 16 },
  guestTitle: { fontSize: 22, fontWeight: 'bold', color: '#2D3748', marginBottom: 8 },
  guestText: { color: '#718096', textAlign: 'center', marginBottom: 24 },
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
  list: { paddingBottom: 32 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2B6CB0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userName: { fontSize: 16, fontWeight: '700', color: '#1A202C' },
  userEmail: { fontSize: 13, color: '#718096' },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E53E3E',
  },
  logoutText: { color: '#E53E3E', fontWeight: '600', fontSize: 13 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: 13, fontWeight: '700', color: '#2D3748' },
  orderStatus: { fontSize: 12, color: '#4A5568' },
  orderDate: { fontSize: 12, color: '#718096', marginBottom: 4 },
  orderTotal: { fontSize: 15, fontWeight: 'bold', color: '#2B6CB0' },
  emptyOrders: { alignItems: 'center', padding: 32 },
  emptyText: { color: '#718096', marginBottom: 16 },
});
