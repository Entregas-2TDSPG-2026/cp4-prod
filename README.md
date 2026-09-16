# 🛍️ Loja FIAP — Expo E-commerce App

App mobile de e-commerce desenvolvido com **Expo Router**, **React Native** e **TypeScript**, consumindo a API REST da **Mockmerce**.

## 🚀 Como rodar

### 1. Clone e instale as dependências
```bash
npm install
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:
```env
EXPO_PUBLIC_API_KEY=sk_live_...       # Chave da API do seu grupo
EXPO_PUBLIC_API_BASE_URL=https://ecommerce-turma.onrender.com/v1
EXPO_PUBLIC_STUDENT_RM=RM000000       # Seu RM (opcional)
```

### 3. Inicie o app
```bash
npx expo start
```

## 📱 Funcionalidades

| # | Missão | Status |
|---|--------|--------|
| F2 | Listar produtos (catálogo paginado) | ✅ |
| F3 | Detalhe do produto + variantes | ✅ |
| F4 | Autenticação (login + registro) | ✅ |
| F5 | Carrinho (add, remover, alterar qty) | ✅ |
| F6 | Checkout → Pedido PENDING | ✅ |
| F7 | Pagamento simulado (PIX/Cartão/Boleto) | ✅ |
| F8 | Lista e detalhe de pedidos | ✅ |
| F9 | Cancelar pedido | ✅ |
| F10 | Repetir pedido (reorder) | ✅ |
| F11 | Webhooks (registro via API) | ✅ API |
| —  | Visita sem login (browse livre) | ✅ |
| —  | Modal de login ao adicionar ao carrinho | ✅ |
| —  | Sessão persistida entre fechamentos | ✅ |

## 🏗️ Arquitetura

```
cp4-prod/
├── src/
│   ├── api/
│   │   ├── client.ts       # HTTP client centralizado (X-API-Key + Bearer)
│   │   ├── auth.ts         # Register, Login, GetMe
│   │   ├── products.ts     # Listar e detalhar produtos
│   │   ├── cart.ts         # CRUD do carrinho
│   │   ├── orders.ts       # Pedidos: checkout, listar, cancelar, reorder
│   │   ├── payments.ts     # Pagamento simulado
│   │   └── webhooks.ts     # Webhooks CRUD
│   ├── types/
│   │   └── index.ts        # Tipos TypeScript da API
│   └── contexts/
│       ├── AuthContext.tsx  # Autenticação + token persistido
│       └── CartContext.tsx  # Estado do carrinho
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # 🏠 Home
│   │   ├── products.tsx     # 🛍️ Catálogo
│   │   ├── cart.tsx         # 🛒 Carrinho
│   │   └── profile.tsx      # 👤 Perfil + Pedidos
│   ├── auth/
│   │   ├── login.tsx        # Tela de login
│   │   └── register.tsx     # Tela de cadastro
│   ├── products/[id].tsx    # Detalhe do produto
│   ├── checkout/
│   │   ├── index.tsx        # Resumo do pedido
│   │   └── payment.tsx      # Pagamento
│   └── orders/[id].tsx      # Detalhe do pedido
```

## 🔐 Segurança

- A API Key **nunca** é escrita no código — lida exclusivamente de `process.env.EXPO_PUBLIC_API_KEY`
- Token do cliente armazenado via `@react-native-async-storage/async-storage`
- Arquivo `.env` está no `.gitignore`

## 🛒 Fluxo de compra

```
Catálogo → Detalhe produto → [Login se necessário] → 
Adicionar ao carrinho → Carrinho → Checkout → Pagamento → Pedido
```

## 🔔 Webhooks

A API suporta webhooks (`POST /v1/webhooks`). Como o Expo não pode expor servidor HTTP público, webhooks requerem uma URL pública (ex: ngrok, Render, Railway). O módulo `src/api/webhooks.ts` expõe todas as operações CRUD para integração futura.

## 🧪 Sandbox

Pagamentos são **simulados**. Resultados podem ser aprovados ou recusados aleatoriamente pelo simulador da API. O app trata ambos os estados sem quebrar a UX.

## 📋 Missões concluídas anteriormente (não reimplementadas)

- F1: Criação de produtos, variantes e estoque (painel admin) — **não exposto no app**
