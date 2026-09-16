import { ApiException } from '@/src/api/client';
import { productsApi } from '@/src/api/products';
import { useAuth } from '@/src/contexts/AuthContext';
import { useCart } from '@/src/contexts/CartContext';
import type { Product, Variant } from '@/src/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function AuthModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Login necessário</Text>
          <Text style={styles.modalText}>
            Para adicionar ao carrinho você precisa estar logado.
          </Text>
          <Pressable
            style={styles.modalPrimaryBtn}
            onPress={() => {
              onClose();
              router.push('/auth/login');
            }}
          >
            <Text style={styles.modalPrimaryBtnText}>Entrar</Text>
          </Pressable>
          <Pressable
            style={styles.modalSecondaryBtn}
            onPress={() => {
              onClose();
              router.push('/auth/register');
            }}
          >
            <Text style={styles.modalSecondaryBtnText}>Criar conta</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [adding, setAdding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    productsApi
      .getById(id)
      .then((p) => {
        setProduct(p);
        if (p.variants?.length > 0) setSelectedVariant(p.variants[0]);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!selectedVariant) {
      Alert.alert('Selecione uma variante');
      return;
    }
    if (selectedVariant.stock === 0) {
      Alert.alert('Produto indisponível', 'Esta variante está sem estoque.');
      return;
    }
    setAdding(true);
    try {
      await addItem(selectedVariant.id, 1);
      Alert.alert('✅ Adicionado!', 'Produto adicionado ao carrinho.', [
        { text: 'Continuar comprando' },
        { text: 'Ver carrinho', onPress: () => router.push('/cart') },
      ]);
    } catch (e) {
      const msg =
        e instanceof ApiException ? e.message : 'Erro ao adicionar ao carrinho.';
      Alert.alert('Erro', msg);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 80 }} size="large" color="#2B6CB0" />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Produto não encontrado'}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Product image */}
        {product.thumbnailUrl ? (
          <Image source={{ uri: product.thumbnailUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Text style={{ fontSize: 64 }}>📦</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price */}
          <Text style={styles.price}>
            {selectedVariant
              ? `R$ ${selectedVariant.price.toFixed(2)}`
              : product.priceFrom === product.priceTo
              ? `R$ ${product.priceFrom.toFixed(2)}`
              : `R$ ${product.priceFrom.toFixed(2)} ~ ${product.priceTo.toFixed(2)}`}
          </Text>

          {/* Description */}
          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}

          {/* Variants */}
          {product.variants && product.variants.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Variantes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {product.variants.map((v) => {
                  const label =
                    v.attributes?.length > 0
                      ? v.attributes.map((a) => a.value).join(' / ')
                      : v.sku;
                  const isSelected = selectedVariant?.id === v.id;
                  const outOfStock = v.stock === 0;
                  return (
                    <Pressable
                      key={v.id}
                      style={[
                        styles.variantChip,
                        isSelected && styles.variantChipSelected,
                        outOfStock && styles.variantChipDisabled,
                      ]}
                      onPress={() => !outOfStock && setSelectedVariant(v)}
                      disabled={outOfStock}
                    >
                      <Text
                        style={[
                          styles.variantChipText,
                          isSelected && styles.variantChipTextSelected,
                          outOfStock && styles.variantChipTextDisabled,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Stock info */}
          {selectedVariant && (
            <Text style={styles.stockInfo}>
              {selectedVariant.stock > 0
                ? `✅ ${selectedVariant.stock} disponíveis`
                : '❌ Sem estoque'}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.addBtn,
            (adding || selectedVariant?.stock === 0) && styles.addBtnDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={adding || selectedVariant?.stock === 0}
        >
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addBtnText}>
              {selectedVariant?.stock === 0 ? 'Indisponível' : 'Adicionar ao carrinho'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  heroImage: { width: '100%', height: 280 },
  heroPlaceholder: {
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 16 },
  productName: { fontSize: 22, fontWeight: 'bold', color: '#1A202C', marginBottom: 8 },
  price: { fontSize: 24, fontWeight: 'bold', color: '#2B6CB0', marginBottom: 12 },
  description: { fontSize: 14, color: '#4A5568', lineHeight: 21, marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748', marginBottom: 10 },
  variantChip: {
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  variantChipSelected: { borderColor: '#2B6CB0', backgroundColor: '#EBF4FF' },
  variantChipDisabled: { borderColor: '#E2E8F0', backgroundColor: '#F7FAFC' },
  variantChipText: { color: '#4A5568', fontWeight: '600' },
  variantChipTextSelected: { color: '#2B6CB0' },
  variantChipTextDisabled: { color: '#CBD5E0' },
  stockInfo: { fontSize: 13, color: '#4A5568', marginTop: 4 },
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
  addBtn: {
    backgroundColor: '#2B6CB0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: '#A0AEC0' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#E53E3E', marginBottom: 12, textAlign: 'center' },
  backText: { color: '#2B6CB0', fontWeight: '600' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '82%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginBottom: 8 },
  modalText: { color: '#718096', textAlign: 'center', marginBottom: 24 },
  modalPrimaryBtn: {
    backgroundColor: '#2B6CB0',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalSecondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#2B6CB0',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSecondaryBtnText: { color: '#2B6CB0', fontWeight: '700', fontSize: 15 },
  modalCancelText: { color: '#718096', fontWeight: '500' },
});
