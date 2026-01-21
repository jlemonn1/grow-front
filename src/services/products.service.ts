import { get, post, patch, del } from './http';
import type { PageResponse } from '@/types/api';
import type { Product, CreateProductRequest, UpdateProductRequest } from '@/types/models';

export interface ListProductsParams {
  q?: string;
  categoryId?: string;
  page?: number;
  size?: number;
}

/**
 * Lista productos con filtros opcionales y paginación
 */
export async function listProducts(
  params?: ListProductsParams
): Promise<PageResponse<Product>> {
  const queryParams = new URLSearchParams();

  if (params?.q) {
    queryParams.append('q', params.q);
  }
  if (params?.categoryId) {
    queryParams.append('categoryId', params.categoryId);
  }
  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.size !== undefined) {
    queryParams.append('size', params.size.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

  return get<PageResponse<Product>>(endpoint);
}

/**
 * Crea un nuevo producto con stock inicial
 */
export async function createProduct(
  data: CreateProductRequest
): Promise<Product> {
  return post<Product>('/products', data);
}

/**
 * Obtiene un producto por su ID
 */
export async function getProductById(id: string): Promise<Product> {
  return get<Product>(`/products/${id}`);
}

/**
 * Actualiza un producto existente (no actualiza stock)
 */
export async function updateProduct(
  id: string,
  data: UpdateProductRequest
): Promise<Product> {
  return patch<Product>(`/products/${id}`, data);
}

/**
 * Elimina un producto permanentemente
 */
export async function deleteProduct(id: string): Promise<void> {
  return del<void>(`/products/${id}`);
}

export interface TopProduct {
  id: string;
  name: string;
  imageUrl: string;
  pricePerGram: number;
  stockGrams: number;
  movementCount: number;
}

/**
 * Obtiene los productos más vendidos ordenados por cantidad de movimientos
 */
export async function getTopProductsByMovements(limit: number = 10): Promise<TopProduct[]> {
  return get<TopProduct[]>(`/products/top-by-movements?limit=${limit}`);
}