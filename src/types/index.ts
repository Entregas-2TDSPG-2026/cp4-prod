// ============================================================
// Mockmerce API — TypeScript types
// Base: https://ecommerce-turma.onrender.com/v1
// ============================================================

// ─── Generic ─────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// ─── Auth ─────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  customer: Customer;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  document: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─── Products & Variants ──────────────────────────────────────

export type ProductType = 'SIMPLE' | 'VARIABLE';
export type ProductState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ProductListItem {
  id: string;
  name: string;
  type: ProductType;
  state: ProductState;
  priceFrom: number;
  priceTo: number;
  stock: number;
  variantsCount: number;
  thumbnailUrl?: string;
  description?: string;
}

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface Variant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: VariantAttribute[];
}

export interface Product extends ProductListItem {
  variants: Variant[];
  images?: string[];
  slug?: string;
}

export interface ProductsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

// ─── Cart ─────────────────────────────────────────────────────

export interface CartItem {
  variantId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface AddCartItemPayload {
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

// ─── Orders ──────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED';

export interface OrderItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    thumbnailUrl?: string;
  };
  variant: {
    id: string;
    sku: string;
    attributes: VariantAttribute[];
  };
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTimeline {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  createdAt: string;
}

// ─── Payments ─────────────────────────────────────────────────

export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';
export type PaymentStatus = 'APPROVED' | 'DECLINED' | 'PENDING';

export interface PaymentPayload {
  orderId: string;
  method: PaymentMethod;
}

export interface PaymentResult {
  id: string;
  orderId: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  createdAt: string;
}

// ─── Webhooks ─────────────────────────────────────────────────

export interface WebhookEvent {
  name: string;
  description: string;
}

/** @deprecated use WebhookEvent */
export type WebhookEventType = WebhookEvent;

export interface Webhook {
  id: string;
  url: string;
  description?: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookPayload {
  url: string;
  description?: string;
  events: string[];
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  statusCode: number;
  success: boolean;
  payload?: Record<string, unknown>;
  responseBody?: string;
  createdAt: string;
}
