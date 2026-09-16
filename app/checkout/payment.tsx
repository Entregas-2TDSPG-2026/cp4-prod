import { ApiException } from '@/src/api/client';
import { paymentsApi } from '@/src/api/payments';
import { useAuth } from '@/src/contexts/AuthContext';
import type { PaymentMethod } from '@/src/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'PIX', label: 'PIX', icon: '⚡' },
  { key: 'CREDIT_CARD', label: 'Cartão de crédito', icon: '💳' },
  { key: 'BOLETO', label: 'Boleto', icon: '📄' },
];

export default function PaymentScreen() {
  const { token } = useAuth();
  const { orderId, total } = useLocalSearchParams<{ orderId: string; total: string }>();
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [loading, setLoading] = useState(false);

  if (!orderId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Pedido inválido.</Text>
          <Pressable onPress={() => router.replace('/')}>
            <Text style={styles.linkText}>Voltar ao início</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handlePay = async () => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    try {
      const result = await paymentsApi.pay(orderId, method, token);
      if (result.status === 'APPROVED') {
        Alert.alert(
          '✅ Pagamento aprovado!',
          `Seu pedido foi confirmado.\nValor: R$ ${result.amount.toFixed(2)}`,
          [{ text: 'Ver meus pedidos', onPress: () => router.replace('/profile') }],
        );
      } else {
        Alert.alert(
          '❌ Pagamento recusado',
          'O pagamento foi recusado pelo simulador. Tente outro método.',
          [{ text: 'Tentar novamente' }],
        );
      }
    } catch (e) {
      const msg =
        e instanceof ApiException ? e.message : 'Erro ao processar pagamento.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const totalNum = parseFloat(total ?? '0');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Pagamento</Text>
      <Text style={styles.subtitle}>Pedido #{orderId.slice(-8).toUpperCase()}</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total a pagar</Text>
        <Text style={styles.totalValue}>R$ {totalNum.toFixed(2)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Forma de pagamento</Text>
      {METHODS.map((m) => (
        <Pressable
          key={m.key}
          style={[styles.methodRow, method === m.key && styles.methodRowSelected]}
          onPress={() => setMethod(m.key)}
        >
          <Text style={styles.methodIcon}>{m.icon}</Text>
          <Text style={[styles.methodLabel, method === m.key && styles.methodLabelSelected]}>
            {m.label}
          </Text>
          <View
            style={[styles.radio, method === m.key && styles.radioSelected]}
          >
            {method === m.key && <View style={styles.radioDot} />}
          </View>
        </Pressable>
      ))}

      <View style={styles.sandboxNote}>
        <Text style={styles.sandboxNoteText}>
          🧪 Sandbox: pagamentos são simulados. Resultados podem ser aleatórios.
        </Text>
      </View>

      <Pressable
        style={[styles.payBtn, loading && styles.btnDisabled]}
        onPress={handlePay}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payBtnText}>Pagar R$ {totalNum.toFixed(2)}</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#718096', marginBottom: 20 },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  totalLabel: { color: '#718096', marginBottom: 4 },
  totalValue: { fontSize: 28, fontWeight: 'bold', color: '#1A202C' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748', marginBottom: 12 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  methodRowSelected: { borderColor: '#2B6CB0', backgroundColor: '#EBF4FF' },
  methodIcon: { fontSize: 22 },
  methodLabel: { flex: 1, fontSize: 15, color: '#4A5568', fontWeight: '600' },
  methodLabelSelected: { color: '#2B6CB0' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: '#2B6CB0' },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2B6CB0',
  },
  sandboxNote: {
    backgroundColor: '#FEFCBF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  sandboxNoteText: { color: '#744210', fontSize: 12 },
  payBtn: {
    backgroundColor: '#2B6CB0',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#E53E3E', marginBottom: 12 },
  linkText: { color: '#2B6CB0', fontWeight: '600' },
});
