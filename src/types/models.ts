// Tipos base de modelos - se extenderán en fases siguientes

export interface Admin {
  id: string;
  username: string;
  isMainAdmin: boolean;
  isActive: boolean;
  createdAt?: string;
  permissions?: Record<string, boolean>;
}

// Constantes de permisos
export const AdminPermission = {
  DISPENSAR: 'DISPENSAR',
  GESTIONAR_PRODUCTOS: 'GESTIONAR_PRODUCTOS',
  GESTIONAR_STOCK: 'GESTIONAR_STOCK',
  GESTIONAR_CLIENTES: 'GESTIONAR_CLIENTES',
  VER_REPORTES: 'VER_REPORTES',
  GESTIONAR_ADMINS: 'GESTIONAR_ADMINS',
} as const;

export type AdminPermissionType = typeof AdminPermission[keyof typeof AdminPermission];

export interface UpdateAdminPermissionsRequest {
  permissions: Record<string, boolean>;
}

export interface Category {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  pricePerGram: number;
  stockGrams: number;
  description?: string;
  imageUrl: string;
  onSale?: boolean;
  salePricePerGram?: number;
  saleDiscountPercent?: number;
  createdAt?: string;
}

export interface Customer {
  id: string;
  displayName: string;
  phone?: string;
  notes?: string;
  pin: string;
  subscriptionType: 'MONTHLY' | 'ANNUAL';
  subscriptionPrice: number;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  createdAt?: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  grams: number;
  pricePerGram: number;
  lineTotal: number;
  discount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  subtotalBeforeDiscount?: number;
}

export interface Sale {
  id: string;
  customerId: string;
  status: string;
  items: SaleItem[];
  totalAmount: number;
  cashGiven: number;
  changeAmount: number;
  createdBy?: Admin;
  createdByUsername?: string;
  createdAt: string;
}

// Tipos para gestión de productos
export interface CreateProductRequest {
  name: string;
  categoryId: string;
  pricePerGram: number;
  description?: string;
  imageUrl: string;
  initialStockGrams: number;
  onSale?: boolean;
  salePricePerGram?: number;
  saleDiscountPercent?: number;
}

export interface UpdateProductRequest {
  name?: string;
  categoryId?: string;
  pricePerGram?: number;
  description?: string;
  imageUrl?: string;
  onSale?: boolean;
  salePricePerGram?: number;
  saleDiscountPercent?: number;
}

export interface StockMovement {
  id: string;
  type: 'INITIAL' | 'RECHARGE' | 'SALE_OUT';
  deltaGrams: number;
  stockBeforeGrams: number;
  stockAfterGrams: number;
  note?: string;
  saleId?: string;
  createdBy?: Admin;
  createdByUsername?: string;
  createdAt: string;
}

export interface RechargeStockRequest {
  grams: number;
  note?: string;
}

export interface StockMovementParams {
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

// Tipos para ticket de venta
export interface TicketItem {
  productId: string;
  product: Product | null; // Snapshot del producto al agregar
  grams: number;
  pricePerGram: number; // Snapshot del precio
  subtotal: number;
  discount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  subtotalBeforeDiscount?: number;
  validationState: 'valid' | 'invalid' | 'checking';
  errorMessage?: string;
}

export interface CreateSaleItemRequest {
  productId: string;
  grams: number;
  discount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
}

export interface CreateSaleRequest {
  customerId: string;
  cashGiven: number;
  items: CreateSaleItemRequest[];
  createdAt?: string; // Fecha personalizada opcional (ISO 8601)
}

// Tipos para borradores de ventas
export interface SaveSaleDraftRequest {
  customerId?: string | null;
  cashGiven: number;
  items: CreateSaleItemRequest[];
}

export interface SaleDraft {
  id: string;
  customerId?: string | null;
  items: CreateSaleItemRequest[];
  cashGiven: number;
  updatedAt: string;
}

// Tipos para perfil de cliente
export interface CustomerSale {
  id: string;
  totalAmount: number;
  createdAt: string;
  status: string;
}

export interface CustomerSummaryItem {
  productId: string;
  productName: string;
  totalGrams: number;
  totalAmount: number;
}

export interface CustomerSummary {
  customerId: string;
  period: {
    from: string;
    to: string;
  };
  totalSpent: number;
  items: CustomerSummaryItem[];
}

// Tipos para reportes
export interface Period {
  from: string;
  to: string;
}

export interface SummaryRow {
  key: string;
  label: string;
  totalGrams?: number;
  totalAmount?: number;
  gramsIn?: number;
}

export interface SalesSummaryResponse {
  period: Period;
  groupBy: string;
  totalAmount: number;
  rows: SummaryRow[];
}

export interface StockSummaryResponse {
  period: Period;
  groupBy: string;
  totalGramsIn: number;
  rows: SummaryRow[];
}

export interface SalesSummaryParams {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'product' | 'category' | 'customer';
}

export interface StockSummaryParams {
  from?: string;
  to?: string;
  groupBy?: 'product' | 'category';
}

// Tipos para reportes avanzados
export interface TrendDataPoint {
  label: string;
  totalAmount: number;
  saleCount: number;
}

export interface SalesTrendResponse {
  period: Period;
  groupBy: string;
  dataPoints: TrendDataPoint[];
}

export interface SalesTrendParams {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

// Tipos para dashboard mensual
export interface ProductStats {
  id: string;
  name: string;
  totalGrams: number;
  totalRevenue: number;
}

export interface CustomerStats {
  id: string;
  displayName: string;
  totalSpent: number;
  totalGrams: number;
  purchaseCount: number;
  avgTicket: number;
}

export interface FumonDelMes {
  id: string;
  displayName: string;
  totalSpent: number;
  totalGrams: number;
  purchaseCount: number;
  loyaltyScore: number;
  reason: string;
}

export interface MonthlyDashboardResponse {
  period: Period;
  year: number;
  month: number;
  topProduct: ProductStats | null;
  mostProfitableProduct: ProductStats | null;
  topCustomers: CustomerStats[];
  fumonDelMes: FumonDelMes | null;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stockGrams: number;
}

export interface ExpiringSubscription {
  id: string;
  displayName: string;
  subscriptionEndDate: string;
}

export interface DaySales {
  totalGrams: number;
  totalAmount: number;
}

export interface SalesComparison {
  yesterday: DaySales;
  today: DaySales;
  forecast: DaySales;
}

export interface DashboardTickerResponse {
  lowStockProducts: LowStockProduct[];
  expiringSubscriptions: ExpiringSubscription[];
  salesComparison: SalesComparison;
}

// Tipos para gestión de clientes
export interface CreateCustomerRequest {
  displayName: string;
  phone?: string;
  notes?: string;
  pin: string;
  subscriptionType?: 'MONTHLY' | 'ANNUAL';
  subscriptionPrice: number;
}

export interface RenewSubscriptionRequest {
  subscriptionType: 'MONTHLY' | 'ANNUAL';
  subscriptionPrice: number;
}

export interface PinCheckResponse {
  available: boolean;
  suggestions: string[];
}

// Tipos para estadísticas por hora
export interface HourlyDataPoint {
  hour: number; // 0-23
  label: string; // "00:00", "01:00", etc.
  totalAmount: number;
  saleCount: number;
  totalGrams: number;
  avgTicket: number;
}

export interface HourlySalesResponse {
  period: Period;
  dataPoints: HourlyDataPoint[];
}

export interface HourlyStockDataPoint {
  hour: number; // 0-23
  label: string; // "00:00", "01:00", etc.
  recharges: number; // Gramos recargados
  salesOut: number; // Gramos vendidos
  totalMovements: number; // Cantidad de movimientos
}

export interface HourlyStockResponse {
  period: Period;
  dataPoints: HourlyStockDataPoint[];
}

export interface ProductByHour {
  productId: string;
  productName: string;
  totalGrams: number;
  totalRevenue: number;
}

export interface HourlyProductStatsDataPoint {
  hour: number; // 0-23
  label: string; // "00:00", "01:00", etc.
  products: ProductByHour[];
}

export interface HourlyProductStatsResponse {
  period: Period;
  dataPoints: HourlyProductStatsDataPoint[];
}