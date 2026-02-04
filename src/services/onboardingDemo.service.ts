import type { Customer, Product, Sale, Admin, Category, SaleItem } from '@/types/models';

export interface DemoData {
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  admins: Admin[];
  category: Category;
}

/**
 * Genera un UUID único usando crypto.randomUUID()
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para navegadores que no soportan crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Genera una fecha ISO string en el pasado
 */
function generateDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(8 + Math.floor(Math.random() * 16), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
  return date.toISOString().slice(0, 19);
}

/**
 * Genera datos mock temporales para el onboarding
 * Todos los datos se generan en memoria sin llamadas API
 */
export function generateMockData(): DemoData {
  // 1. Crear categoría mock
  const category: Category = {
    id: generateUUID(),
    name: 'Categoría de Prueba',
    createdAt: generateDate(30),
  };

  // 2. Crear clientes mock
  const customerData = [
    { displayName: 'Juan Pérez', phone: '+34 600 123 456', pin: '12AB', subscriptionPrice: 50 },
    { displayName: 'María García', phone: '+34 600 234 567', pin: '23CD', subscriptionPrice: 75 },
    { displayName: 'Carlos López', phone: '+34 600 345 678', pin: '34EF', subscriptionPrice: 100 },
    { displayName: 'Ana Martínez', phone: '+34 600 456 789', pin: '45GH', subscriptionPrice: 60 },
    { displayName: 'Luis Rodríguez', phone: '+34 600 567 890', pin: '56IJ', subscriptionPrice: 80 },
  ];

  const customers: Customer[] = customerData.map((data, index) => {
    const subscriptionStartDate = new Date();
    subscriptionStartDate.setMonth(subscriptionStartDate.getMonth() - (index + 1));
    const subscriptionEndDate = new Date(subscriptionStartDate);
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    return {
      id: generateUUID(),
      displayName: data.displayName,
      phone: data.phone,
      pin: data.pin,
      subscriptionType: 'MONTHLY' as const,
      subscriptionPrice: data.subscriptionPrice,
      subscriptionStartDate: subscriptionStartDate.toISOString().split('T')[0],
      subscriptionEndDate: subscriptionEndDate.toISOString().split('T')[0],
      notes: 'Cliente de prueba generado para onboarding',
      createdAt: generateDate(30 - index * 5),
    };
  });

  // 3. Crear productos mock
  const productData = [
    { name: 'Producto Premium A', price: 12.50, description: 'Producto de alta calidad', stock: 2000 },
    { name: 'Producto Estándar B', price: 8.75, description: 'Producto estándar', stock: 2000 },
    { name: 'Producto Especial C', price: 15.00, description: 'Producto especial', stock: 2000 },
    { name: 'Producto Básico D', price: 6.25, description: 'Producto básico', stock: 2000 },
    { name: 'Producto Exclusivo E', price: 20.00, description: 'Producto exclusivo', stock: 2000 },
  ];

  const products: Product[] = productData.map((data, index) => ({
    id: generateUUID(),
    name: data.name,
    category: category,
    pricePerGram: data.price,
    stockGrams: data.stock,
    description: data.description,
    imageUrl: 'https://via.placeholder.com/300x300?text=' + encodeURIComponent(data.name),
    createdAt: generateDate(25 - index * 3),
  }));

  // 4. Crear ventas mock
  const sales: Sale[] = [];
  const startDate = new Date('2025-12-05T08:00:00');
  const endDate = new Date('2026-01-21T23:00:00');
  const timeDiff = endDate.getTime() - startDate.getTime();

  // Crear 10 ventas distribuidas en el tiempo
  for (let i = 0; i < 10; i++) {
    const randomTime = Math.random() * timeDiff;
    const saleDate = new Date(startDate.getTime() + randomTime);
    
    const hour = 8 + Math.floor(Math.random() * 16);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    saleDate.setHours(hour, minute, second, 0);

    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    
    const grams = 5 + Math.floor(Math.random() * 45);
    const pricePerGram = randomProduct.pricePerGram;
    const lineTotal = grams * pricePerGram;
    const totalAmount = lineTotal;
    const cashGiven = Math.ceil(totalAmount * (1.1 + Math.random() * 0.2));
    const changeAmount = cashGiven - totalAmount;

    const saleItem: SaleItem = {
      id: generateUUID(),
      productId: randomProduct.id,
      productName: randomProduct.name,
      imageUrl: randomProduct.imageUrl,
      grams: grams,
      pricePerGram: pricePerGram,
      lineTotal: lineTotal,
    };

    const sale: Sale = {
      id: generateUUID(),
      customerId: randomCustomer.id,
      status: 'COMPLETED',
      items: [saleItem],
      totalAmount: totalAmount,
      cashGiven: cashGiven,
      changeAmount: changeAmount,
      createdAt: saleDate.toISOString().slice(0, 19),
    };

    sales.push(sale);
  }

  // 5. Crear admin mock (opcional, para mostrar en el tour)
  const admins: Admin[] = [
    {
      id: generateUUID(),
      username: 'admin_demo',
      isMainAdmin: false,
      isActive: true,
      createdAt: generateDate(20),
    },
  ];

  return {
    customers,
    products,
    sales,
    admins,
    category,
  };
}

/**
 * Función de compatibilidad con el código existente
 * Ahora solo genera datos mock sin llamadas API
 */
export async function createDemoData(): Promise<DemoData> {
  return Promise.resolve(generateMockData());
}

/**
 * Limpia los datos mock (solo en memoria, no hace nada ya que no hay datos en BD)
 */
export async function cleanupDemoData(_demoData?: DemoData): Promise<void> {
  // No hay nada que limpiar ya que los datos solo existen en memoria
  // Las referencias se limpiarán automáticamente cuando se desactive el modo demo
  console.log('Datos de demo limpiados (solo en memoria)');
}
