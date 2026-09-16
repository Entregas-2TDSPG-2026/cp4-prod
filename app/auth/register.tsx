import { ApiException } from '@/src/api/client';
import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── CPF / CNPJ helpers ───────────────────────────────────────────────────────

function applyDocumentMask(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  // CNPJ: 00.000.000/0000-00
  return digits
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function isValidCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== Number(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === Number(d[10]);
}

function isValidCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (weights: number[]) =>
    weights.reduce((sum, w, i) => sum + Number(d[i]) * w, 0);
  const mod = (n: number) => { const r = n % 11; return r < 2 ? 0 : 11 - r; };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return mod(calc(w1)) === Number(d[12]) && mod(calc(w2)) === Number(d[13]);
}

function validateDocument(doc: string): string | null {
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) return isValidCPF(doc) ? null : 'CPF inválido. Verifique os dígitos.';
  if (digits.length === 14) return isValidCNPJ(doc) ? null : 'CNPJ inválido. Verifique os dígitos.';
  return 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [docError, setDocError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDocumentChange = (text: string) => {
    const masked = applyDocumentMask(text);
    setDocument(masked);
    // valida em tempo real só quando já digitou o suficiente
    const digits = masked.replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 14) {
      setDocError(validateDocument(masked) ?? '');
    } else {
      setDocError('');
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !document.trim() || !password || !confirm) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    const docErr = validateDocument(document);
    if (docErr) {
      setDocError(docErr);
      Alert.alert('CPF/CNPJ inválido', docErr);
      return;
    }
    if (password !== confirm) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter ao menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        document: document.trim(),
      });
      // navegação feita pelo AuthGate no _layout.tsx
    } catch (e) {
      const msg =
        e instanceof ApiException && e.statusCode === 409
          ? 'Este e-mail já está cadastrado.'
          : (e as Error).message;
      Alert.alert('Erro ao criar conta', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Criar conta 🎉</Text>
          <Text style={styles.subtitle}>Junte-se à Loja FIAP</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              returnKeyType="next"
            />

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
            />

            <Text style={styles.label}>CPF / CNPJ</Text>
            <TextInput
              style={[styles.input, docError ? styles.inputError : null]}
              placeholder="000.000.000-00"
              value={document}
              onChangeText={handleDocumentChange}
              keyboardType="numeric"
              returnKeyType="next"
              maxLength={18}
            />
            {docError ? <Text style={styles.errorText}>⚠ {docError}</Text> : null}

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
            />

            <Text style={styles.label}>Confirmar senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            <Pressable
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Criar conta</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já tem conta? </Text>
            <Pressable onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginLink}>Entrar</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A202C', marginBottom: 6 },
  subtitle: { color: '#718096', marginBottom: 32 },
  form: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D3748',
    backgroundColor: '#F7FAFC',
  },
  inputError: {
    borderColor: '#E53E3E',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  btn: {
    backgroundColor: '#2B6CB0',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { color: '#718096' },
  loginLink: { color: '#2B6CB0', fontWeight: '600' },
});
