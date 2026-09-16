import { api } from './client';
import type { PaginatedResponse, Product, ProductListItem, ProductsListParams } from '../types';

export const productsApi = {
  list: (params: ProductsListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params.search) qs.set('search', params.search);
    if (params.minPrice != null) qs.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) qs.set('maxPrice', String(params.maxPrice));
    const query = qs.toString();
    return api.get<PaginatedResponse<ProductListItem>>(`/products${query ? `?${query}` : ''}`);
  },

  getById: (id: string) =>
    api.get<Product>(`/products/${id}`),
};
