import { get, post, put, del, patch } from './http';
import type { Coupon, CreateCouponRequest, UpdateCouponRequest, ValidateCouponRequest, ValidateCouponResponse } from '@/types/models';

const BASE_URL = '/coupons';

export const couponsService = {
  async getAll(): Promise<Coupon[]> {
    return get<Coupon[]>(BASE_URL);
  },

  async getById(id: string): Promise<Coupon> {
    return get<Coupon>(`${BASE_URL}/${id}`);
  },

  async create(data: CreateCouponRequest): Promise<Coupon> {
    return post<Coupon>(BASE_URL, data);
  },

  async update(id: string, data: UpdateCouponRequest): Promise<Coupon> {
    return put<Coupon>(`${BASE_URL}/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return del<void>(`${BASE_URL}/${id}`);
  },

  async toggleStatus(id: string, active: boolean): Promise<Coupon> {
    return patch<Coupon>(`${BASE_URL}/${id}/toggle?active=${active}`);
  },

  async validate(data: ValidateCouponRequest): Promise<ValidateCouponResponse> {
    return post<ValidateCouponResponse>(`${BASE_URL}/validate`, data);
  },
};
