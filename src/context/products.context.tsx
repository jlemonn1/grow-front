import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { 
  listProducts, 
  createProduct as createProductService,
  getProductById as getProductByIdService,
  updateProduct as updateProductService,
  type ListProductsParams 
} from '@/services/products.service';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentParamsRef = useRef<ListProductsParams>({});
  const [pagination, setPagination] = useState({
    page: 0,
    size: 25,
    total: 0,
    totalPages: 0,
  });

  const loadProducts = useCallback(async (params?: ListProductsParams) => {
    setLoading(true);
    setError(null);
    
    const searchParams = params || currentParamsRef.current;
    currentParamsRef.current = searchParams;

    try {
      const response: PageResponse<Product> = await listProducts(searchParams);
      setProducts(response.content);
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
  }, []);

  const refreshProducts = useCallback(async () => {
    await loadProducts(currentParamsRef.current);
  }, [loadProducts]);

  const createProduct = useCallback(async (data: CreateProductRequest): Promise<Product> => {
    const newProduct = await createProductService(data);
    // Actualizar cache: agregar el nuevo producto a la lista
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  }, []);

  const updateProduct = useCallback(async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const updatedProduct = await updateProductService(id, data);
    // Actualizar cache: reemplazar el producto en la lista
    setProducts((prev) => 
      prev.map((p) => (p.id === id ? updatedProduct : p))
    );
    return updatedProduct;
  }, []);

  const getProductById = useCallback(async (id: string): Promise<Product | null> => {
    // Primero buscar en cache
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
  }, [products]);

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
