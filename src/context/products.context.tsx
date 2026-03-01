import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { 
  listProducts, 
  createProduct as createProductService,
  getProductById as getProductByIdService,
  updateProduct as updateProductService,
  type ListProductsParams 
} from '@/services/products.service';
import { useDemo } from './demo.context';
import type { Product, CreateProductRequest, UpdateProductRequest } from '@/types/models';
import type { PageResponse } from '@/types/api';

interface ProductsContextValue {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  loadProducts: (params?: ListProductsParams) => Promise<void>;
  refreshProducts: () => Promise<void>;
  createProduct: (data: CreateProductRequest) => Promise<Product>;
  updateProduct: (id: string, data: UpdateProductRequest) => Promise<Product>;
  getProductById: (id: string) => Promise<Product | null>;
  updateProductStock: (id: string, newStock: number) => void;
  refreshProduct: (id: string) => Promise<void>;
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

interface ProductsProviderProps {
  children: ReactNode;
}

export function ProductsProvider({ children }: ProductsProviderProps) {
  const { isDemoMode, demoData } = useDemo();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentParamsRef = useRef<ListProductsParams>({});
  const demoDataSyncedRef = useRef<string | null>(null); // Track si ya sincronizamos estos datos
  const [pagination, setPagination] = useState({
    page: 0,
    size: 25,
    total: 0,
    totalPages: 0,
  });

  // Sincronizar datos mock cuando se activa el modo demo
  useEffect(() => {
    if (isDemoMode && demoData) {
      // Evitar sincronizar si ya tenemos estos datos (usar el primer ID como referencia)
      const demoDataId = demoData.products.length > 0 ? demoData.products[0].id : null;
      if (demoDataSyncedRef.current === demoDataId && products.length > 0) {
        return; // Ya están sincronizados
      }
      
      demoDataSyncedRef.current = demoDataId;
      
      // Filtrar según parámetros de búsqueda si existen
      let filteredProducts = demoData.products;
      const params = currentParamsRef.current;
      
      if (params.q) {
        const query = params.q.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category.name.toLowerCase().includes(query)
        );
      }

      // Simular paginación
      const page = params.page || 0;
      const size = params.size || 25;
      const start = page * size;
      const end = start + size;
      const paginatedProducts = filteredProducts.slice(start, end);
      
      const sortedProducts = [...paginatedProducts].sort((a, b) => {
        if (a.stockGrams <= 0 && b.stockGrams > 0) return 1;
        if (a.stockGrams > 0 && b.stockGrams <= 0) return -1;
        return 0;
      });

      setProducts(sortedProducts);
      setPagination({
        page: page,
        size: size,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / size),
      });
      setLoading(false);
      setError(null);
    } else if (!isDemoMode) {
      // Si se desactiva el modo demo, limpiar referencia
      demoDataSyncedRef.current = null;
      if (products.length > 0 && demoData) {
        // Solo limpiar si había datos mock
        setProducts([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode, demoData?.products.length]); // Solo depender del length para evitar re-renders innecesarios

  const loadProducts = useCallback(async (params?: ListProductsParams) => {
    // Si estamos en modo demo, usar datos mock
    if (isDemoMode && demoData) {
      setLoading(true);
      setError(null);
      
      const searchParams = params || currentParamsRef.current;
      currentParamsRef.current = searchParams;

      // Filtrar según parámetros de búsqueda
      let filteredProducts = demoData.products;
      
      if (searchParams.q) {
        const query = searchParams.q.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category.name.toLowerCase().includes(query)
        );
      }

      // Simular paginación
      const page = searchParams.page || 0;
      const size = searchParams.size || 25;
      const start = page * size;
      const end = start + size;
      const paginatedProducts = filteredProducts.slice(start, end);
      
      const sortedProducts = [...paginatedProducts].sort((a, b) => {
        if (a.stockGrams <= 0 && b.stockGrams > 0) return 1;
        if (a.stockGrams > 0 && b.stockGrams <= 0) return -1;
        return 0;
      });

      setProducts(sortedProducts);
      setPagination({
        page: page,
        size: size,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / size),
      });
      setLoading(false);
      return;
    }

    // Modo normal: llamar a la API
    setLoading(true);
    setError(null);
    
    const searchParams = params || currentParamsRef.current;
    currentParamsRef.current = searchParams;

    try {
      const response: PageResponse<Product> = await listProducts(searchParams);
      const sortedProducts = [...response.content].sort((a, b) => {
        if (a.stockGrams <= 0 && b.stockGrams > 0) return 1;
        if (a.stockGrams > 0 && b.stockGrams <= 0) return -1;
        return 0;
      });
      setProducts(sortedProducts);
      setPagination({
        page: response.number,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, demoData]);

  const refreshProducts = useCallback(async () => {
    await loadProducts(currentParamsRef.current);
  }, [loadProducts]);

  const createProduct = useCallback(async (data: CreateProductRequest): Promise<Product> => {
    // Si estamos en modo demo, crear producto mock localmente
    if (isDemoMode && demoData) {
      const category = demoData.category;
      const newProduct: Product = {
        id: crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}`,
        name: data.name,
        category: category,
        pricePerGram: data.pricePerGram,
        stockGrams: data.initialStockGrams || 0,
        description: data.description,
        imageUrl: data.imageUrl || '',
        createdAt: new Date().toISOString(),
        measurementType: data.measurementType,
      };
      // Actualizar cache: agregar el nuevo producto a la lista
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    }

    // Modo normal: llamar a la API
    const newProduct = await createProductService(data);
    // Actualizar cache: agregar el nuevo producto a la lista
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  }, [isDemoMode, demoData]);

  const updateProduct = useCallback(async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const updatedProduct = await updateProductService(id, data);
    // Actualizar cache: reemplazar el producto en la lista
    setProducts((prev) => 
      prev.map((p) => (p.id === id ? updatedProduct : p))
    );
    return updatedProduct;
  }, []);

  const getProductById = useCallback(async (id: string): Promise<Product | null> => {
    // Si estamos en modo demo, buscar en datos mock
    if (isDemoMode && demoData) {
      const mockProduct = demoData.products.find((p) => p.id === id);
      if (mockProduct) {
        return mockProduct;
      }
      // También buscar en el cache local (por si se creó uno nuevo)
      const cachedProduct = products.find((p) => p.id === id);
      return cachedProduct || null;
    }

    // Modo normal: primero buscar en cache
    const cachedProduct = products.find((p) => p.id === id);
    if (cachedProduct) {
      return cachedProduct;
    }
    
    // Si no está en cache, obtener desde API
    try {
      const product = await getProductByIdService(id);
      // Agregar al cache si no está en la lista
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === id);
        return exists ? prev : [...prev, product];
      });
      return product;
    } catch (err) {
      return null;
    }
  }, [products, isDemoMode, demoData]);

  const updateProductStock = useCallback((id: string, newStock: number): void => {
    // Actualizar stock localmente en el cache
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stockGrams: newStock } : p))
    );
  }, []);

  const refreshProduct = useCallback(async (id: string): Promise<void> => {
    try {
      const product = await getProductByIdService(id);
      // Actualizar en cache o agregar si no existe
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === id);
        if (exists) {
          return prev.map((p) => (p.id === id ? product : p));
        } else {
          return [...prev, product];
        }
      });
    } catch (err) {
      // Si no existe, remover del cache
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  const value: ProductsContextValue = {
    products,
    loading,
    error,
    pagination,
    loadProducts,
    refreshProducts,
    createProduct,
    updateProduct,
    getProductById,
    updateProductStock,
    refreshProduct,
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts debe usarse dentro de ProductsProvider');
  }
  return context;
}
