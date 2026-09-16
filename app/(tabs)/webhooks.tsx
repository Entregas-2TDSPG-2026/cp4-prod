import { webhooksApi } from '@/src/api/webhooks';
import { useAuth } from '@/src/contexts/AuthContext';
import type { Webhook, WebhookDelivery, WebhookEvent } from '@/src/types';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR');
}

function shortId(id: string) {
  return id.slice(-8).toUpperCase();
}

// ─── Toast (feedback visual dentro de modais) ─────────────────────────────────

function useToast() {
  const opacity = useRef(new Animated.Value(0)).current;
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const show = useCallback(
    (message: string, error = false) => {
      setMsg(message);
      setIsError(error);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    },
    [opacity],
  );

  const Toast = () => (
    <Animated.View
      style={[
        styles.toast,
        { opacity, backgroundColor: isError ? '#E53E3E' : '#276749' },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.toastText}>{msg}</Text>
    </Animated.View>
  );

  return { show, Toast };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ active }: { active: boolean }) {
  return (
    <View style={[styles.statusDot, { backgroundColor: active ? '#38A169' : '#A0AEC0' }]} />
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Create Webhook Modal ─────────────────────────────────────────────────────

function CreateWebhookModal({
  visible,
  events,
  onClose,
  onCreated,
}: {
  visible: boolean;
  events: WebhookEvent[];
  onClose: () => void;
  onCreated: (wh: Webhook) => void;
}) {
  const { token } = useAuth();
  const { show, Toast } = useToast();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleEvent = (name: string) =>
    setSelectedEvents((prev) =>
      prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name],
    );

  const reset = () => {
    setUrl('');
    setDescription('');
    setSelectedEvents([]);
  };

  const handleCreate = async () => {
    if (!token) return;
    if (!url.trim()) { show('Informe a URL do webhook.', true); return; }
    if (selectedEvents.length === 0) { show('Selecione pelo menos um evento.', true); return; }

    setLoading(true);
    try {
      const result = await webhooksApi.create(
        { url: url.trim(), description: description.trim() || undefined, events: selectedEvents },
        token,
      );
      onCreated(result);
      reset();
      onClose();
      // Mostrar secret via Alert fora do modal (já fechou)
      setTimeout(() => {
        Alert.alert('✅ Webhook criado!', `Guarde seu signing secret:\n\n${result.signingSecret}`);
      }, 400);
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : 'Falha ao criar webhook.', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <Toast />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Novo Webhook</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.inputLabel}>URL *</Text>
          <TextInput
            style={styles.input}
            placeholder="https://webhook.site/..."
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Descrição</Text>
          <TextInput
            style={styles.input}
            placeholder="Descrição opcional"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.inputLabel}>Eventos *</Text>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>Carregando eventos…</Text>
          ) : (
            events.map((ev) => (
              <Pressable
                key={ev.name}
                style={styles.eventRow}
                onPress={() => toggleEvent(ev.name)}
              >
                <View style={[styles.checkbox, selectedEvents.includes(ev.name) && styles.checkboxChecked]}>
                  {selectedEvents.includes(ev.name) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{ev.name}</Text>
                  {ev.description ? <Text style={styles.eventDesc}>{ev.description}</Text> : null}
                </View>
              </Pressable>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>

        <View style={styles.modalFooter}>
          <Pressable
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Criar Webhook</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Webhook Card ─────────────────────────────────────────────────────────────

function WebhookCard({ webhook, onAction }: { webhook: Webhook; onAction: (wh: Webhook) => void }) {
  return (
    <Pressable style={styles.card} onPress={() => onAction(webhook)}>
      <View style={styles.cardHeader}>
        <StatusDot active={webhook.active} />
        <Text style={styles.cardId}>#{shortId(webhook.id)}</Text>
        <Text style={styles.cardStatus}>{webhook.active ? 'Ativo' : 'Inativo'}</Text>
      </View>
      <Text style={styles.cardUrl} numberOfLines={1}>{webhook.url}</Text>
      {webhook.description ? <Text style={styles.cardDesc} numberOfLines={1}>{webhook.description}</Text> : null}
      <Text style={styles.cardEvents}>{webhook.events.join(', ')}</Text>
      <Text style={styles.cardDate}>Criado em {formatDate(webhook.createdAt)}</Text>
    </Pressable>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function WebhookDetailModal({
  webhook,
  onClose,
  onDeleted,
  onUpdated,
}: {
  webhook: Webhook;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onUpdated: (wh: Webhook) => void;
}) {
  const { token } = useAuth();
  const { show, Toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [active, setActive] = useState(webhook.active);

  useEffect(() => {
    if (!token) return;
    setLoadingDeliveries(true);
    webhooksApi
      .getDeliveries(token)
      .then((res) => setDeliveries(res.data.filter((d) => d.webhookId === webhook.id)))
      .catch(() => setDeliveries([]))
      .finally(() => setLoadingDeliveries(false));
  }, [token, webhook.id]);

  const run = async (action: () => Promise<unknown>, key: string, successMsg: string) => {
    if (!token) { show('Sem token de autenticação.', true); return; }
    setLoading(key);
    try {
      await action();
      show(successMsg);
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : 'Falha na operação.', true);
    } finally {
      setLoading(null);
    }
  };

  const handleToggleActive = async (val: boolean) => {
    if (!token) return;
    setActive(val);
    try {
      const updated = await webhooksApi.update(webhook.id, { active: val }, token);
      onUpdated(updated);
      show(val ? 'Webhook ativado.' : 'Webhook desativado.');
    } catch (e: unknown) {
      setActive(!val);
      show(e instanceof Error ? e.message : 'Falha ao atualizar.', true);
    }
  };

  const handleDelete = () => {
    Alert.alert('Excluir Webhook', 'Tem certeza? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          setLoading('delete');
          try {
            await webhooksApi.delete(webhook.id, token);
            onDeleted(webhook.id);
            onClose();
          } catch (e: unknown) {
            setLoading(null);
            show(e instanceof Error ? e.message : 'Falha ao excluir.', true);
          }
        },
      },
    ]);
  };

  const handleRotateSecret = () => {
    Alert.alert('Rotacionar Secret', 'O signing secret atual será invalidado. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rotacionar',
        onPress: async () => {
          if (!token) return;
          setLoading('rotate');
          try {
            const res = await webhooksApi.rotateSecret(webhook.id, token);
            show('Secret rotacionado!');
            setTimeout(() => Alert.alert('🔑 Novo Signing Secret', res.signingSecret), 500);
          } catch (e: unknown) {
            show(e instanceof Error ? e.message : 'Falha.', true);
          } finally {
            setLoading(null);
          }
        },
      },
    ]);
  };

  const handleResend = (deliveryId: string) => {
    if (!token) return;
    setLoading(`resend-${deliveryId}`);
    webhooksApi
      .resendDelivery(deliveryId, token)
      .then(() => show('Entrega reenviada.'))
      .catch((e: unknown) => show(e instanceof Error ? e.message : 'Falha.', true))
      .finally(() => setLoading(null));
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <Toast />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Webhook #{shortId(webhook.id)}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalBody}>
          {/* Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>URL</Text>
            <Text style={styles.infoValue}>{webhook.url}</Text>
            {webhook.description ? (
              <>
                <Text style={styles.infoLabel}>Descrição</Text>
                <Text style={styles.infoValue}>{webhook.description}</Text>
              </>
            ) : null}
            <Text style={styles.infoLabel}>Eventos</Text>
            <Text style={styles.infoValue}>{webhook.events.join(', ')}</Text>
            <Text style={styles.infoLabel}>Criado em</Text>
            <Text style={styles.infoValue}>{formatDate(webhook.createdAt)}</Text>
          </View>

          {/* Toggle active */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Webhook ativo</Text>
            <Switch
              value={active}
              onValueChange={handleToggleActive}
              trackColor={{ true: '#38A169', false: '#A0AEC0' }}
            />
          </View>

          {/* Actions */}
          <SectionHeader title="Ações" />
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionBtn, styles.actionBtnBlue, loading === 'ping' && styles.btnDisabled]}
              disabled={!!loading}
              onPress={() => run(() => webhooksApi.ping(webhook.id, token!), 'ping', '🏓 Ping enviado!')}
            >
              {loading === 'ping'
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.actionBtnText}>🏓 Ping</Text>}
            </Pressable>

            <Pressable
              style={[styles.actionBtn, styles.actionBtnYellow, loading === 'rotate' && styles.btnDisabled]}
              disabled={!!loading}
              onPress={handleRotateSecret}
            >
              {loading === 'rotate'
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.actionBtnText}>🔑 Secret</Text>}
            </Pressable>

            <Pressable
              style={[styles.actionBtn, styles.actionBtnRed, loading === 'delete' && styles.btnDisabled]}
              disabled={!!loading}
              onPress={handleDelete}
            >
              {loading === 'delete'
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.actionBtnText}>🗑 Excluir</Text>}
            </Pressable>
          </View>

          {/* Deliveries */}
          <SectionHeader title="Entregas recentes" />
          {loadingDeliveries ? (
            <ActivityIndicator color="#2B6CB0" style={{ marginVertical: 12 }} />
          ) : deliveries.length === 0 ? (
            <Text style={[styles.emptyText, { marginHorizontal: 16, marginVertical: 8 }]}>
              Nenhuma entrega registrada.
            </Text>
          ) : (
            deliveries.map((d) => (
              <View key={d.id} style={styles.deliveryCard}>
                <View style={styles.deliveryRow}>
                  <Text style={[styles.deliveryStatus, { color: d.success ? '#38A169' : '#E53E3E' }]}>
                    {d.success ? '✅' : '❌'} {d.statusCode}
                  </Text>
                  <Text style={styles.deliveryEvent}>{d.event}</Text>
                </View>
                <Text style={styles.deliveryDate}>{formatDate(d.createdAt)}</Text>
                <Pressable
                  style={styles.resendBtn}
                  disabled={loading === `resend-${d.id}`}
                  onPress={() => handleResend(d.id)}
                >
                  {loading === `resend-${d.id}`
                    ? <ActivityIndicator color="#2B6CB0" size="small" />
                    : <Text style={styles.resendBtnText}>Reenviar</Text>}
                </Pressable>
              </View>
            ))
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WebhooksScreen() {
  const { isAuthenticated, token } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Webhook | null>(null);
  const [deliverNowLoading, setDeliverNowLoading] = useState(false);

  const loadData = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([webhooksApi.list(token), webhooksApi.listEvents(token)])
      .then(([whs, evts]) => { setWebhooks(whs); setEvents(evts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeliverNow = () => {
    if (!token) return;
    setDeliverNowLoading(true);
    webhooksApi
      .deliverNow(token)
      .then((res) => Alert.alert('✅ Deliver Now', `${res.queued ?? 0} entrega(s) enfileirada(s).`))
      .catch((e: unknown) => Alert.alert('Erro', e instanceof Error ? e.message : 'Falha.'))
      .finally(() => setDeliverNowLoading(false));
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.bigIcon}>🔔</Text>
          <Text style={styles.guestTitle}>Webhooks</Text>
          <Text style={styles.guestText}>Faça login para gerenciar seus webhooks.</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/auth/login')}>
            <Text style={styles.primaryBtnText}>Entrar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={webhooks}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => <WebhookCard webhook={item} onAction={setSelected} />}
        onRefresh={loadData}
        refreshing={loading}
        ListHeaderComponent={
          <>
            <View style={styles.screenHeader}>
              <Text style={styles.screenTitle}>🔔 Webhooks</Text>
              <Pressable style={styles.deliverNowBtn} disabled={deliverNowLoading} onPress={handleDeliverNow}>
                {deliverNowLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.deliverNowText}>Deliver Now</Text>}
              </Pressable>
            </View>
            <Pressable
              style={[styles.primaryBtn, { marginHorizontal: 16, marginBottom: 12 }]}
              onPress={() => setShowCreate(true)}
            >
              <Text style={styles.primaryBtnText}>+ Novo Webhook</Text>
            </Pressable>
            {webhooks.length > 0 && (
              <Text style={styles.listLabel}>Seus webhooks ({webhooks.length})</Text>
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Text style={styles.bigIcon}>📭</Text>
              <Text style={styles.emptyText}>Nenhum webhook cadastrado.</Text>
              <Text style={styles.emptySubText}>Crie um webhook para receber notificações de eventos da loja.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />

      <CreateWebhookModal
        visible={showCreate}
        events={events}
        onClose={() => setShowCreate(false)}
        onCreated={(wh) => setWebhooks((prev) => [wh, ...prev])}
      />

      {selected && (
        <WebhookDetailModal
          webhook={selected}
          onClose={() => setSelected(null)}
          onDeleted={(id) => { setWebhooks((prev) => prev.filter((w) => w.id !== id)); setSelected(null); }}
          onUpdated={(updated) => {
            setWebhooks((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
            setSelected(updated);
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  list: { paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 48 },
  bigIcon: { fontSize: 56, marginBottom: 16 },
  guestTitle: { fontSize: 22, fontWeight: 'bold', color: '#2D3748', marginBottom: 8 },
  guestText: { color: '#718096', textAlign: 'center', marginBottom: 24 },
  emptyText: { color: '#718096', textAlign: 'center', marginBottom: 8 },
  emptySubText: { color: '#A0AEC0', textAlign: 'center', fontSize: 13 },

  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: '#1A202C' },
  listLabel: { fontSize: 13, fontWeight: '700', color: '#718096', marginHorizontal: 16, marginBottom: 4, marginTop: 4 },

  primaryBtn: { backgroundColor: '#2B6CB0', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },

  deliverNowBtn: { backgroundColor: '#553C9A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  deliverNowText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  cardId: { fontSize: 13, fontWeight: '700', color: '#2D3748', flex: 1 },
  cardStatus: { fontSize: 12, color: '#718096' },
  cardUrl: { fontSize: 13, color: '#2B6CB0', marginBottom: 2 },
  cardDesc: { fontSize: 12, color: '#718096', marginBottom: 2 },
  cardEvents: { fontSize: 11, color: '#A0AEC0', marginBottom: 4 },
  cardDate: { fontSize: 11, color: '#CBD5E0' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  sectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748' },

  modalContainer: { flex: 1, backgroundColor: '#F7FAFC' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EDF2F7', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 16, color: '#4A5568' },
  modalBody: { flex: 1, padding: 16 },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#fff' },

  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1A202C', backgroundColor: '#fff' },

  eventRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F8', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#CBD5E0', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#2B6CB0', borderColor: '#2B6CB0' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  eventName: { fontSize: 13, fontWeight: '600', color: '#2D3748' },
  eventDesc: { fontSize: 11, color: '#718096' },

  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#A0AEC0', marginTop: 8 },
  infoValue: { fontSize: 13, color: '#1A202C' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 4 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#2D3748' },

  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnBlue: { backgroundColor: '#2B6CB0' },
  actionBtnYellow: { backgroundColor: '#D69E2E' },
  actionBtnRed: { backgroundColor: '#E53E3E' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  deliveryCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  deliveryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  deliveryStatus: { fontSize: 13, fontWeight: '700' },
  deliveryEvent: { fontSize: 12, color: '#718096' },
  deliveryDate: { fontSize: 11, color: '#A0AEC0', marginBottom: 6 },
  resendBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#2B6CB0' },
  resendBtnText: { color: '#2B6CB0', fontSize: 12, fontWeight: '600' },

  // Toast
  toast: { position: 'absolute', bottom: 80, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, zIndex: 999, maxWidth: '85%' },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 14, textAlign: 'center' },
});
