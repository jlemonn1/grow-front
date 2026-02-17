import { get, post, del, patch } from './http';
import type { Admin, UpdateAdminPermissionsRequest } from '@/types/models';

export interface CreateAdminRequest {
  username: string;
  password: string;
}

/**
 * Obtiene el admin actual autenticado
 */
export async function getCurrentAdmin(): Promise<Admin> {
  return get<Admin>('/admins/me');
}

/**
 * Lista todos los administradores (solo admin principal)
 */
export async function getAllAdmins(): Promise<Admin[]> {
  return get<Admin[]>('/admins');
}

/**
 * Crea un nuevo administrador (solo admin principal)
 */
export async function createAdmin(username: string, password: string): Promise<Admin> {
  return post<Admin>('/admins', { username, password });
}

/**
 * Desactiva un administrador (solo admin principal)
 */
export async function deleteAdmin(id: string): Promise<void> {
  return del(`/admins/${id}`);
}

/**
 * Obtiene los permisos de un administrador (solo admin principal)
 */
export async function getAdminPermissions(id: string): Promise<Record<string, boolean>> {
  return get<Record<string, boolean>>(`/admins/${id}/permissions`);
}

/**
 * Actualiza los permisos de un administrador (solo admin principal)
 */
export async function updateAdminPermissions(
  id: string,
  permissions: Record<string, boolean>
): Promise<Admin> {
  const request: UpdateAdminPermissionsRequest = { permissions };
  return patch<Admin>(`/admins/${id}/permissions`, request);
}

/**
 * Actualiza la configuración de accesibilidad de color de un administrador
 */
export async function updateAdminColorAccessibility(
  id: string,
  colorAccessibility: 'normal' | 'protanopia' | 'high-contrast'
): Promise<Admin> {
  return patch<Admin>(`/admins/${id}/color-accessibility`, { colorAccessibility });
}