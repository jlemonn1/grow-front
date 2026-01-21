export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
  productInfo?: {
    productName?: string;
    availableStock?: number;
    requestedStock?: number;
  };
}

export interface ValidationError extends ApiError {
  status: 422;
  fieldErrors: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Alias para compatibilidad con Spring Data Page
export type PageResponse<T> = PaginatedResponse<T>;