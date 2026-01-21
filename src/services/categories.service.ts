import { get, post } from './http';
import type { Category } from '@/types/models';

export interface CategoriesResponse {
  items: Category[];
}

export interface CreateCategoryRequest {
  name: string;
}

/**
 * Lista todas las categorías disponibles
 */
export async function listCategories(): Promise<Category[]> {
  const response = await get<CategoriesResponse>('/categories');
  return response.items;
}

/**
 * Crea una nueva categoría
 */
export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  return post<Category>('/categories', data);
}
