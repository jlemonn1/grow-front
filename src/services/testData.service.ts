import { customersService } from './customers.service';
import { createProduct } from './products.service';
import { createSale } from './sales.service';
import { listCategories, createCategory } from './categories.service';
import { triggerPanicMode } from './panic.service';
import type { CreateCustomerRequest, CreateProductRequest, CreateSaleRequest } from '@/types/models';

/**
 * Carga datos de prueba en el backend (easter egg)
 * Crea categorías, clientes, productos y ventas de ejemplo
 * Esta es la misma función que se usa en ConfigPage cuando se hace clic 4 veces
 */
export async function loadTestDataForOnboarding(): Promise<{
  customers: number;
  products: number;
  sales: number;
}> {
  // Obtener o crear categoría
  let categories = await listCategories();
  let categoryId: string;
  
  if (categories.length === 0) {
    const newCategory = await createCategory({ name: 'Categoría de Prueba' });
    categoryId = newCategory.id;
  } else {
    categoryId = categories[0].id;
  }

  // Crear 5 clientes
  const customerNames = [
    { displayName: 'Juan Pérez', phone: '+34 600 123 456', pin: '12AB', subscriptionPrice: 50 },
    { displayName: 'María García', phone: '+34 600 234 567', pin: '23CD', subscriptionPrice: 75 },
    { displayName: 'Carlos López', phone: '+34 600 345 678', pin: '34EF', subscriptionPrice: 100 },
    { displayName: 'Ana Martínez', phone: '+34 600 456 789', pin: '45GH', subscriptionPrice: 60 },
    { displayName: 'Luis Rodríguez', phone: '+34 600 567 890', pin: '56IJ', subscriptionPrice: 80 },
  ];

  const createdCustomers = [];
  for (const customerData of customerNames) {
    const customerRequest: CreateCustomerRequest = {
      displayName: customerData.displayName,
      phone: customerData.phone,
      pin: customerData.pin,
      subscriptionType: 'MONTHLY',
      subscriptionPrice: customerData.subscriptionPrice,
      notes: 'Cliente de prueba generado por easter egg',
    };
    const customer = await customersService.create(customerRequest);
    createdCustomers.push(customer);
  }

  // Crear 5 productos con stock suficiente para 40 ventas
  const productData = [
    { name: 'Producto Premium A', price: 12.50, description: 'Producto de alta calidad', stock: 2000 },
    { name: 'Producto Estándar B', price: 8.75, description: 'Producto estándar', stock: 2000 },
    { name: 'Producto Especial C', price: 15.00, description: 'Producto especial', stock: 2000 },
    { name: 'Producto Básico D', price: 6.25, description: 'Producto básico', stock: 2000 },
    { name: 'Producto Exclusivo E', price: 20.00, description: 'Producto exclusivo', stock: 2000 },
  ];

  const createdProducts = [];
  for (const productInfo of productData) {
    const productRequest: CreateProductRequest = {
      name: productInfo.name,
      categoryId: categoryId,
      pricePerGram: productInfo.price,
      description: productInfo.description,
      imageUrl: 'https://via.placeholder.com/300x300?text=' + encodeURIComponent(productInfo.name),
      initialStockGrams: productInfo.stock,
    };
    const product = await createProduct(productRequest);
    createdProducts.push(product);
  }

  // Crear 40 ventas distribuidas entre el 5 de diciembre 2025 y el 21 de enero 2026
  const sales = [];
  const startDate = new Date('2025-12-05T08:00:00');
  const endDate = new Date('2026-01-21T23:00:00');
  const timeDiff = endDate.getTime() - startDate.getTime();

  for (let i = 0; i < 40; i++) {
    // Generar fecha aleatoria entre el 5 de diciembre 2025 y el 21 de enero 2026
    const randomTime = Math.random() * timeDiff;
    const saleDate = new Date(startDate.getTime() + randomTime);
    
    // Asegurar que la hora esté entre 8:00 y 23:00
    const hour = 8 + Math.floor(Math.random() * 16); // 8-23 (inclusive)
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    saleDate.setHours(hour, minute, second, 0);

    // Seleccionar cliente y producto aleatorios
    const randomCustomer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
    const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
    
    // Gramos aleatorios entre 5 y 50
    const grams = 5 + Math.floor(Math.random() * 45);
    const pricePerGram = randomProduct.pricePerGram;
    const subtotal = grams * pricePerGram;
    
    // Efectivo entregado (un poco más que el total para tener cambio)
    const cashGiven = Math.ceil(subtotal * (1.1 + Math.random() * 0.2));

    const saleRequest: CreateSaleRequest = {
      customerId: randomCustomer.id,
      cashGiven: cashGiven,
      cashGivenDenominations: {}, // Denominaciones vacías para datos de prueba
      items: [
        {
          productId: randomProduct.id,
          grams: grams,
        },
      ],
      // Enviar fecha personalizada en formato ISO 8601 compatible con LocalDateTime
      // Formato: YYYY-MM-DDTHH:mm:ss (sin zona horaria)
      createdAt: saleDate.toISOString().slice(0, 19), // Formato: 2024-12-05T14:30:00
    };

    try {
      const sale = await createSale(saleRequest);
      sales.push(sale);
    } catch (error) {
      console.error(`Error creando venta ${i + 1}:`, error);
    }
  }

  return {
    customers: createdCustomers.length,
    products: createdProducts.length,
    sales: sales.length,
  };
}

/**
 * Borra los datos de prueba creados para el onboarding
 * Usa el servicio de panic para limpiar todos los datos excepto admins y configuración
 */
export async function cleanupTestData(): Promise<void> {
  console.log('[cleanupTestData] Limpiando datos de prueba...');
  try {
    // Usar el servicio de panic que limpia todos los datos excepto admins y configuración
    const result = await triggerPanicMode();
    console.log('[cleanupTestData] ✓ Datos de prueba eliminados:', result.message);
  } catch (error) {
    console.error('[cleanupTestData] Error eliminando datos de prueba:', error);
    throw error;
  }
}

