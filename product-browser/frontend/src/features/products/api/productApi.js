import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

/**
 * Fetch a page of products using cursor-based pagination.
 *
 * @param {Object} params
 * @param {string|null} params.cursor - Opaque cursor string, null for first page
 * @param {number} params.limit - Number of products to fetch
 * @param {string|null} params.category - Category filter, null for all
 * @param {AbortSignal} params.signal - AbortController signal for cancellation
 */
export async function fetchProducts({ cursor = null, limit = 20, category = null, signal } = {}) {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  if (category) params.category = category;

  const { data } = await api.get('/products', { params, signal });
  return data;
}

/**
 * Fetch the fixed list of product categories.
 */
export async function fetchCategories() {
  const { data } = await api.get('/categories');
  return data;
}
