import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SaleCreatePage } from '@/pages/sales/SaleCreatePage';
import { ProductCreatePage } from '@/pages/products/ProductCreatePage';
import { ProductsPage } from '@/pages/products/ProductsPage';
import { ProductDetailPage } from '@/pages/products/ProductDetailPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { CustomerCreatePage } from '@/pages/customers/CustomerCreatePage';
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage';
import type { TourStep } from '@/hooks/useOnboardingTour';

/**
 * Estados superiores para el renderizado de páginas en el tour
 */
export type TourPageState = 
  | 'sales'           // Pasos 0-13: página de ventas
  | 'transition'      // Paso 14: transición (renderiza productos pero estado intermedio)
  | 'transition-list' // Transición a lista de productos
  | 'transition-detail' // Transición a detalle de producto
  | 'products-create' // Página de crear producto (/products/new)
  | 'products-list'   // Página de lista de productos (/products)
  | 'product-detail'  // Página de detalle de producto (/products/:id)
  | 'transition-to-customers' // Transición a clientes
  | 'transition-to-customer-create' // Transición a crear cliente
  | 'transition-to-customer-detail' // Transición a detalle de cliente
  | 'customers-list'  // Página de lista de clientes (/customers)
  | 'customers-create' // Página de crear cliente (/customers/new)
  | 'customer-detail'; // Página de detalle de cliente (/customers/:id)

/**
 * Determina el estado de página según el paso actual del tour
 */
export function getTourPageState(step: number, stepData: TourStep | undefined): TourPageState {
  if (!stepData) {
    return 'sales'; // Por defecto, ventas
  }

  // Paso de transición explícito
  if (stepData.id === 'transition-to-products') {
    return 'transition';
  }
  
  if (stepData.id === 'transition-to-products-list') {
    return 'transition-list';
  }
  
  if (stepData.id === 'transition-to-product-detail') {
    return 'transition-detail';
  }
  
  if (stepData.id === 'transition-to-customers') {
    return 'transition-to-customers';
  }
  
  if (stepData.id === 'transition-to-customer-create') {
    return 'transition-to-customer-create';
  }
  
  if (stepData.id === 'transition-to-customer-detail') {
    return 'transition-to-customer-detail';
  }

  // Determinar por ruta del paso
  const route = stepData.route;
  
  if (route === '/products') {
    return 'products-list';
  }
  
  if (route.startsWith('/products/')) {
    // Si es /products/new, es crear producto
    if (route === '/products/new') {
      return 'products-create';
    }
    // Si tiene un ID (formato /products/:id), es detalle
    if (route.match(/^\/products\/[^/]+$/)) {
      return 'product-detail';
    }
    // Por defecto, crear producto
    return 'products-create';
  }
  
  if (route === '/customers') {
    return 'customers-list';
  }
  
  if (route.startsWith('/customers/')) {
    // Si es /customers/new, es crear cliente
    if (route === '/customers/new') {
      return 'customers-create';
    }
    // Si tiene un ID (formato /customers/:id), es detalle
    if (route.match(/^\/customers\/[^/]+$/)) {
      return 'customer-detail';
    }
    // Por defecto, crear cliente
    return 'customers-create';
  }

  // Pasos 15+ que no tienen ruta específica de productos, asumir crear producto
  if (step >= 15) {
    return 'products-create';
  }

  // Por defecto, ventas (pasos 0-13)
  return 'sales';
}

/**
 * Obtiene el componente a renderizar según el estado de página
 */
function getPageComponent(state: TourPageState): React.ComponentType {
  switch (state) {
    case 'sales':
      return SaleCreatePage;
    case 'transition':
    case 'products-create':
      return ProductCreatePage;
    case 'transition-list':
    case 'products-list':
      return ProductsPage;
    case 'transition-detail':
    case 'product-detail':
      return ProductDetailPage;
    case 'transition-to-customers':
    case 'customers-list':
      return CustomersPage;
    case 'transition-to-customer-create':
    case 'customers-create':
      return CustomerCreatePage;
    case 'transition-to-customer-detail':
    case 'customer-detail':
      return CustomerDetailPage;
    default:
      return SaleCreatePage;
  }
}

interface TourPageRendererProps {
  currentStep: number;
  currentStepData: TourStep | undefined;
  productId?: string | null;
  customerId?: string | null;
}

/**
 * Componente dedicado para renderizar la página correcta según el paso del tour
 * Maneja la lógica de decisión y estados superiores de forma explícita
 * 
 * ESTRATEGIA SIMPLE: Forzar re-render completo cuando cambia la ruta del paso
 * usando un contador de refresh que se incrementa cada vez que cambia la ruta
 */
export function TourPageRenderer({ currentStep, currentStepData, productId, customerId }: TourPageRendererProps) {
  // Contador de refresh que se incrementa cuando cambia la ruta del paso o el estado de página
  const [refreshKey, setRefreshKey] = useState(0);
  // Estado forzado para el paso de transición (cuando se hace clic en "Cargar página")
  const [forcedPageState, setForcedPageState] = useState<TourPageState | null>(null);
  const previousRouteRef = useRef<string | undefined>(undefined);
  const previousPageStateRef = useRef<TourPageState | undefined>(undefined);

  // Determinar el estado de página usando la función de decisión
  // IMPORTANTE: El paso de transición (14) siempre renderiza 'products' directamente
  // igual que el paso 0 siempre renderiza 'sales' directamente
  const pageState = useMemo(() => {
    // Si hay un estado forzado, usarlo SIEMPRE (esto se establece cuando se hace clic en "Cargar página")
    // Tiene prioridad absoluta sobre cualquier otra lógica
    // IMPORTANTE: Mantener el estado forzado incluso si el paso es 0 temporalmente
    if (forcedPageState) {
      console.log(`[TourPageRenderer] Usando estado forzado: ${forcedPageState} (paso: ${currentStep}, ruta: ${currentStepData?.route}, id: ${currentStepData?.id})`);
      return forcedPageState;
    }
    
    // Paso 0 siempre renderiza ventas (SaleCreatePage)
    // PERO solo si NO hay un estado forzado activo
    if (currentStep === 0 && !forcedPageState) {
      return 'sales';
    }
    
    // Paso 14 (transición) siempre renderiza productos (ProductCreatePage)
    // Esto es igual que el paso 0 renderiza ventas
    if (currentStep === 14 || currentStepData?.id === 'transition-to-products') {
      console.log(`[TourPageRenderer] Paso de transición (${currentStep}) - renderizando productos directamente`);
      return 'products-create';
    }
    
    // Transición a lista de productos siempre renderiza lista de productos
    if (currentStepData?.id === 'transition-to-products-list') {
      console.log(`[TourPageRenderer] Paso de transición a lista (${currentStep}) - renderizando lista de productos directamente`);
      return 'products-list';
    }
    
    // Transición a detalle de producto siempre renderiza detalle de producto
    if (currentStepData?.id === 'transition-to-product-detail') {
      console.log(`[TourPageRenderer] Paso de transición a detalle (${currentStep}) - renderizando detalle de producto directamente`);
      return 'product-detail';
    }
    
    // Transición a clientes siempre renderiza lista de clientes
    if (currentStepData?.id === 'transition-to-customers') {
      console.log(`[TourPageRenderer] Paso de transición a clientes (${currentStep}) - renderizando lista de clientes directamente`);
      return 'customers-list';
    }
    
    // Transición a crear cliente siempre renderiza crear cliente
    if (currentStepData?.id === 'transition-to-customer-create') {
      console.log(`[TourPageRenderer] Paso de transición a crear cliente (${currentStep}) - renderizando crear cliente directamente`);
      return 'customers-create';
    }
    
    // Transición a detalle de cliente siempre renderiza detalle de cliente
    if (currentStepData?.id === 'transition-to-customer-detail') {
      console.log(`[TourPageRenderer] Paso de transición a detalle de cliente (${currentStep}) - renderizando detalle de cliente directamente`);
      return 'customer-detail';
    }
    
    // Para otros pasos, usar la función de decisión normal
    return getTourPageState(currentStep, currentStepData);
  }, [currentStep, currentStepData, forcedPageState]);

  // Función para forzar refresh manualmente (llamada desde eventos personalizados)
  // Esta función se ejecuta cuando se hace clic en "Cargar página" en el paso de transición
  const forceRefresh = useCallback((event?: Event) => {
    console.log(`[TourPageRenderer] 🔄 Forzando refresh manual desde evento`);
    
    // Obtener el tipo de transición del evento o del paso actual
    let transitionType: string | null = null;
    if (event && 'detail' in event && (event as CustomEvent).detail) {
      transitionType = (event as CustomEvent).detail.transitionType;
    }
    
    // Si no viene en el evento, intentar determinarlo del paso actual
    if (!transitionType) {
      if (currentStepData?.id === 'transition-to-products-list') {
        transitionType = 'products-list';
      } else if (currentStepData?.id === 'transition-to-product-detail') {
        transitionType = 'product-detail';
      } else if (currentStepData?.id === 'transition-to-products') {
        transitionType = 'products-create';
      } else if (currentStepData?.id === 'transition-to-customers') {
        transitionType = 'customers-list';
      } else if (currentStepData?.id === 'transition-to-customer-create') {
        transitionType = 'customers-create';
      } else if (currentStepData?.id === 'transition-to-customer-detail') {
        transitionType = 'customer-detail';
      }
    }
    
    console.log(`[TourPageRenderer] Tipo de transición detectado: ${transitionType || 'desconocido'}, currentStep: ${currentStep}, currentStepData id: ${currentStepData?.id}`);
    
    // Determinar qué estado forzar según el tipo de transición
    let targetState: TourPageState;
    if (transitionType === 'products-list') {
      targetState = 'products-list';
      console.log(`[TourPageRenderer] Forzando estado a 'products-list' y refrescando`);
    } else if (transitionType === 'product-detail') {
      targetState = 'product-detail';
      console.log(`[TourPageRenderer] Forzando estado a 'product-detail' y refrescando`);
    } else if (transitionType === 'customers-list') {
      targetState = 'customers-list';
      console.log(`[TourPageRenderer] Forzando estado a 'customers-list' y refrescando`);
    } else if (transitionType === 'customers-create') {
      targetState = 'customers-create';
      console.log(`[TourPageRenderer] Forzando estado a 'customers-create' y refrescando`);
    } else if (transitionType === 'customer-detail') {
      targetState = 'customer-detail';
      console.log(`[TourPageRenderer] Forzando estado a 'customer-detail' y refrescando`);
    } else {
      // Por defecto, transición a productos (crear)
      targetState = 'products-create';
      console.log(`[TourPageRenderer] Forzando estado a 'products-create' y refrescando`);
    }
    
    setForcedPageState(targetState);
    // Incrementar refreshKey para forzar re-render inmediato
    setRefreshKey(prev => {
      const newKey = prev + 1;
      console.log(`[TourPageRenderer] RefreshKey incrementado a: ${newKey}`);
      return newKey;
    });
  }, [currentStep, currentStepData]);

  // Escuchar evento personalizado para forzar refresh manual
  useEffect(() => {
    const handleForceRefresh = (event: Event) => {
      forceRefresh(event);
    };

    window.addEventListener('tour:force-page-refresh', handleForceRefresh);
    return () => {
      window.removeEventListener('tour:force-page-refresh', handleForceRefresh);
    };
  }, [forceRefresh]);

  // Detectar cambios en la ruta o estado de página y forzar refresh
  // IMPORTANTE: No interferir cuando hay un estado forzado (forcedPageState)
  useEffect(() => {
    // Si hay un estado forzado, no hacer nada - el estado forzado tiene prioridad
    if (forcedPageState) {
      console.log(`[TourPageRenderer] Estado forzado activo (${forcedPageState}), saltando detección de cambios`);
      return;
    }

    const currentRoute = currentStepData?.route;
    const previousRoute = previousRouteRef.current;
    const previousPageState = previousPageStateRef.current;

    let shouldRefresh = false;

    // Si cambió la ruta, forzar refresh
    if (currentRoute && currentRoute !== previousRoute) {
      console.log(`[TourPageRenderer] 🔄 Cambio de ruta detectado: ${previousRoute || 'N/A'} -> ${currentRoute}`);
      shouldRefresh = true;
      previousRouteRef.current = currentRoute;
    } else if (!previousRoute && currentRoute) {
      // Primera vez que se establece la ruta
      previousRouteRef.current = currentRoute;
    }

    // Si cambió el estado de página, también forzar refresh
    if (pageState !== previousPageState) {
      if (previousPageState !== undefined) {
        console.log(`[TourPageRenderer] 🔄 Cambio de estado de página detectado: ${previousPageState} -> ${pageState}`);
        shouldRefresh = true;
      }
      previousPageStateRef.current = pageState;
    }

    if (shouldRefresh) {
      console.log(`[TourPageRenderer] Forzando re-render completo con refreshKey: ${refreshKey + 1}`);
      setRefreshKey(prev => prev + 1);
    }
  }, [currentStepData?.route, pageState, forcedPageState]);

  // Limpiar estado forzado SOLO cuando avanzamos después de las transiciones
  // NO limpiar mientras estamos en los pasos de transición
  useEffect(() => {
    const isTransitionStep = currentStep === 14 || 
                            currentStepData?.id === 'transition-to-products' ||
                            currentStepData?.id === 'transition-to-products-list' ||
                            currentStepData?.id === 'transition-to-product-detail' ||
                            currentStepData?.id === 'transition-to-customers' ||
                            currentStepData?.id === 'transition-to-customer-create' ||
                            currentStepData?.id === 'transition-to-customer-detail';
    
    // Si estamos en un paso de transición, mantener el estado forzado
    if (isTransitionStep) {
      return;
    }
    
    // Solo limpiar si NO estamos en el paso de transición Y hay un estado forzado
    // Esto asegura que el estado forzado se mantenga mientras estamos en los pasos de transición
    if (forcedPageState) {
      // Limpiar después de transición a productos (paso 15+ y ruta es /products/new)
      if (forcedPageState === 'products-create' && currentStep >= 15 && currentStepData?.route === '/products/new') {
        // Verificar que el contenedor esté presente antes de limpiar
        const container = document.querySelector('.product-create-container');
        if (container) {
          console.log(`[TourPageRenderer] Limpiando estado forzado - avanzamos al paso ${currentStep} (después de transición a productos, contenedor presente)`);
          setForcedPageState(null);
        }
      }
      // Limpiar después de transición a lista (cuando la ruta es /products y NO es paso de transición)
      // Esperar a que realmente estemos en un paso con ruta /products y no sea transición
      // IMPORTANTE: Mantener el estado forzado hasta que el siguiente paso esté completamente establecido
      else if (forcedPageState === 'products-list' && currentStepData?.route === '/products' && !isTransitionStep) {
        // Verificar que el contenedor esté presente antes de limpiar
        const container = document.querySelector('.products-page-container');
        if (container) {
          // Esperar un poco más para asegurar que el componente esté completamente montado y estable
          // Usar un delay más largo para dar tiempo a que React termine de renderizar completamente
          const timeoutId = setTimeout(() => {
            const containerStillPresent = document.querySelector('.products-page-container');
            // Verificar también que el paso actual realmente tenga la ruta /products
            // Y que no sea el paso de transición mismo
            const currentRoute = currentStepData?.route;
            const isStillTransition = currentStepData?.id === 'transition-to-products-list';
            if (containerStillPresent && currentRoute === '/products' && !isStillTransition) {
              console.log(`[TourPageRenderer] Limpiando estado forzado - avanzamos al paso ${currentStep} (después de transición a lista, contenedor presente y estable, ruta: ${currentRoute})`);
              setForcedPageState(null);
            } else {
              console.log(`[TourPageRenderer] Manteniendo estado forzado - condiciones no cumplidas (contenedor: ${!!containerStillPresent}, ruta: ${currentRoute}, esTransición: ${isStillTransition})`);
            }
          }, 1500); // Esperar 1500ms adicionales para asegurar estabilidad completa
          
          return () => clearTimeout(timeoutId);
        } else {
          console.log(`[TourPageRenderer] Manteniendo estado forzado - contenedor aún no presente (paso ${currentStep}, ruta: ${currentStepData?.route}, id: ${currentStepData?.id})`);
        }
      }
      // Limpiar después de transición a crear cliente (paso con ruta /customers/new)
      else if (forcedPageState === 'customers-create' && currentStepData?.route === '/customers/new' && !isTransitionStep) {
        // Verificar que el contenedor esté presente antes de limpiar
        const container = document.querySelector('.customer-create-container');
        if (container) {
          console.log(`[TourPageRenderer] Limpiando estado forzado - avanzamos al paso ${currentStep} (después de transición a crear cliente, contenedor presente)`);
          setForcedPageState(null);
        }
      }
      // Limpiar después de transición a lista de clientes (cuando la ruta es /customers y NO es paso de transición)
      else if (forcedPageState === 'customers-list' && currentStepData?.route === '/customers' && !isTransitionStep) {
        // Verificar que el contenedor esté presente antes de limpiar
        const container = document.querySelector('.customers-page-container');
        if (container) {
          // Esperar un poco más para asegurar que el componente esté completamente montado y estable
          const timeoutId = setTimeout(() => {
            const containerStillPresent = document.querySelector('.customers-page-container');
            const currentRoute = currentStepData?.route;
            const isStillTransition = currentStepData?.id === 'transition-to-customers';
            if (containerStillPresent && currentRoute === '/customers' && !isStillTransition) {
              console.log(`[TourPageRenderer] Limpiando estado forzado - avanzamos al paso ${currentStep} (después de transición a lista de clientes, contenedor presente y estable, ruta: ${currentRoute})`);
              setForcedPageState(null);
            } else {
              console.log(`[TourPageRenderer] Manteniendo estado forzado - condiciones no cumplidas (contenedor: ${!!containerStillPresent}, ruta: ${currentRoute}, esTransición: ${isStillTransition})`);
            }
          }, 1500); // Esperar 1500ms adicionales para asegurar estabilidad completa
          
          return () => clearTimeout(timeoutId);
        } else {
          console.log(`[TourPageRenderer] Manteniendo estado forzado - contenedor aún no presente (paso ${currentStep}, ruta: ${currentStepData?.route}, id: ${currentStepData?.id})`);
        }
      }
      // Limpiar después de transición a detalle de cliente (cuando la ruta es /customers/:id y NO es paso de transición)
      // IMPORTANTE: Mantener el estado forzado hasta que el siguiente paso tenga la ruta correcta Y el contenedor esté presente
      else if (forcedPageState === 'customer-detail') {
        // Verificar que NO estemos en el paso de transición
        if (!isTransitionStep) {
          // Verificar que la ruta sea /customers/:id (no /customers/new ni /customers)
          const isCustomerDetailRoute = (currentStepData?.route?.includes('/customers/') && 
                                       !currentStepData?.route?.includes('/customers/new') &&
                                       currentStepData?.route !== '/customers') ||
                                      currentStepData?.route === '/customers/:id';
          
          // Si la ruta es /customers, puede ser que aún no se haya actualizado - mantener estado forzado
          if (currentStepData?.route === '/customers') {
            console.log(`[TourPageRenderer] Manteniendo estado forzado - ruta es /customers (puede ser temporal antes de actualizar a /customers/:id) (paso ${currentStep}, id: ${currentStepData?.id})`);
            return;
          }
          
          // Solo intentar limpiar si la ruta es válida Y el contenedor está presente
          if (isCustomerDetailRoute) {
            // Verificar que el contenedor esté presente antes de limpiar
            const container = document.querySelector('.customer-detail-container');
            if (container) {
              // Esperar un poco más para asegurar que el componente esté completamente montado y estable
              const timeoutId = setTimeout(() => {
                const containerStillPresent = document.querySelector('.customer-detail-container');
                const currentRoute = currentStepData?.route;
                const isStillTransition = currentStepData?.id === 'transition-to-customer-detail';
                const isValidRoute = (currentRoute?.includes('/customers/') && 
                                     !currentRoute?.includes('/customers/new') &&
                                     currentRoute !== '/customers') ||
                                    currentRoute === '/customers/:id';
                
                // Solo limpiar si TODAS las condiciones se cumplen
                if (containerStillPresent && isValidRoute && !isStillTransition) {
                  console.log(`[TourPageRenderer] Limpiando estado forzado - avanzamos al paso ${currentStep} (después de transición a detalle de cliente, contenedor presente y estable, ruta: ${currentRoute})`);
                  setForcedPageState(null);
                } else {
                  console.log(`[TourPageRenderer] Manteniendo estado forzado - condiciones no cumplidas (contenedor: ${!!containerStillPresent}, ruta: ${currentRoute}, esTransición: ${isStillTransition}, rutaVálida: ${isValidRoute})`);
                }
              }, 3000); // Aumentar a 3000ms para dar más tiempo de estabilización
              
              return () => clearTimeout(timeoutId);
            } else {
              // Contenedor no presente todavía - mantener estado forzado
              console.log(`[TourPageRenderer] Manteniendo estado forzado - contenedor aún no presente (paso ${currentStep}, ruta: ${currentStepData?.route}, id: ${currentStepData?.id})`);
            }
          } else {
            // Si la ruta no es válida todavía, mantener el estado forzado
            console.log(`[TourPageRenderer] Manteniendo estado forzado - ruta aún no válida para detalle de cliente (paso ${currentStep}, ruta: ${currentStepData?.route}, id: ${currentStepData?.id})`);
          }
        } else {
          // Aún en paso de transición - mantener estado forzado
          console.log(`[TourPageRenderer] Manteniendo estado forzado - aún en paso de transición (paso ${currentStep}, id: ${currentStepData?.id})`);
        }
      }
      // Limpiar después de transición a detalle de producto (cuando la ruta es /products/:id y NO es paso de transición)
      // IMPORTANTE: Mantener el estado forzado hasta que el siguiente paso tenga la ruta correcta Y el contenedor esté presente
      else if (forcedPageState === 'product-detail') {
        // Verificar que NO estemos en el paso de transición
        if (!isTransitionStep) {
          // Verificar que la ruta sea /products/:id (no /products/new ni /products)
          // También aceptar /products/:id como patrón dinámico
          // IMPORTANTE: También mantener el estado forzado si la ruta es /products (puede ser temporal)
          const isProductDetailRoute = (currentStepData?.route?.includes('/products/') && 
                                       !currentStepData?.route?.includes('/products/new') &&
                                       currentStepData?.route !== '/products') ||
                                      currentStepData?.route === '/products/:id';
          
          // Si la ruta es /products, puede ser que aún no se haya actualizado - mantener estado forzado
          if (currentStepData?.route === '/products') {
            console.log(`[TourPageRenderer] Manteniendo estado forzado - ruta es /products (puede ser temporal antes de actualizar a /products/:id) (paso ${currentStep}, id: ${currentStepData?.id})`);
            return;
          }
          
          // Solo intentar limpiar si la ruta es válida Y el contenedor está presente
          if (isProductDetailRoute) {
            // Verificar que el contenedor esté presente antes de limpiar
            const container = document.querySelector('.product-detail-container');
            if (container) {
              // Esperar un poco más para asegurar que el componente esté completamente montado y estable
              const timeoutId = setTimeout(() => {
                const containerStillPresent = document.querySelector('.product-detail-container');
                const currentRoute = currentStepData?.route;
                const isStillTransition = currentStepData?.id === 'transition-to-product-detail';
                const isValidRoute = (currentRoute?.includes('/products/') && 
                                     !currentRoute?.includes('/products/new') &&
                                     currentRoute !== '/products') ||
                                    currentRoute === '/products/:id';
                
                // Solo limpiar si TODAS las condiciones se cumplen
                if (containerStillPresent && isValidRoute && !isStillTransition) {
                  console.log(`[TourPageRenderer] Limpiando estado forzado - avanzamos al paso ${currentStep} (después de transición a detalle, contenedor presente y estable, ruta: ${currentRoute})`);
                  setForcedPageState(null);
                } else {
                  console.log(`[TourPageRenderer] Manteniendo estado forzado - condiciones no cumplidas (contenedor: ${!!containerStillPresent}, ruta: ${currentRoute}, esTransición: ${isStillTransition}, rutaVálida: ${isValidRoute})`);
                }
              }, 3000); // Aumentar a 3000ms para dar más tiempo de estabilización
              
              return () => clearTimeout(timeoutId);
            } else {
              // Contenedor no presente todavía - mantener estado forzado
              console.log(`[TourPageRenderer] Manteniendo estado forzado - contenedor aún no presente (paso ${currentStep}, ruta: ${currentStepData?.route}, id: ${currentStepData?.id})`);
            }
          } else {
            // Si la ruta no es válida todavía, mantener el estado forzado
            // Esto es crítico: no limpiar hasta que la ruta sea correcta
            console.log(`[TourPageRenderer] Manteniendo estado forzado - ruta aún no válida para detalle (paso ${currentStep}, ruta: ${currentStepData?.route}, id: ${currentStepData?.id})`);
          }
        } else {
          // Aún en paso de transición - mantener estado forzado
          console.log(`[TourPageRenderer] Manteniendo estado forzado - aún en paso de transición (paso ${currentStep}, id: ${currentStepData?.id})`);
        }
      }
    }
  }, [currentStep, currentStepData, forcedPageState]);

  // Obtener el componente a renderizar
  const PageComponent = useMemo(() => {
    return getPageComponent(pageState);
  }, [pageState]);

  // Extraer productId de la ruta del paso si está disponible y no tenemos productId como prop
  const extractedProductId = useMemo(() => {
    if (productId) {
      return productId;
    }
    
    // Intentar extraer el ID de la ruta del paso (ej: /products/9d08180b-8887-4e8f-aaee-73b448b5465a)
    const route = currentStepData?.route;
    if (route && route.includes('/products/') && route !== '/products/new' && route !== '/products') {
      const match = route.match(/\/products\/([^/]+)/);
      if (match && match[1]) {
        console.log(`[TourPageRenderer] 🔍 ID extraído de la ruta del paso: ${match[1]}`);
        return match[1];
      }
    }
    
    return null;
  }, [productId, currentStepData?.route]);
  
  // Extraer customerId de la ruta del paso si está disponible y no tenemos customerId como prop
  const extractedCustomerId = useMemo(() => {
    if (customerId) {
      return customerId;
    }
    
    // Intentar extraer el ID de la ruta del paso (ej: /customers/9d08180b-8887-4e8f-aaee-73b448b5465a)
    const route = currentStepData?.route;
    if (route && route.includes('/customers/') && route !== '/customers/new' && route !== '/customers') {
      const match = route.match(/\/customers\/([^/]+)/);
      if (match && match[1]) {
        console.log(`[TourPageRenderer] 🔍 ID de cliente extraído de la ruta del paso: ${match[1]}`);
        return match[1];
      }
    }
    
    return null;
  }, [customerId, currentStepData?.route]);
  
  // Log para debugging
  console.log(`[TourPageRenderer] Step: ${currentStep}, State: ${pageState}, Route: ${currentStepData?.route || 'N/A'}, ProductId: ${productId || 'N/A'}, ExtractedProductId: ${extractedProductId || 'N/A'}, CustomerId: ${customerId || 'N/A'}, ExtractedCustomerId: ${extractedCustomerId || 'N/A'}, RefreshKey: ${refreshKey}`);
  console.log(`[TourPageRenderer] Condiciones para MemoryRouter:`, {
    isProductDetail: pageState === 'product-detail',
    isTransitionDetail: pageState === 'transition-detail',
    hasProductId: !!productId,
    hasExtractedId: !!extractedProductId,
    productIdValue: productId,
    extractedIdValue: extractedProductId,
    shouldUseMemoryRouter: (pageState === 'product-detail' || pageState === 'transition-detail') && !!(productId || extractedProductId)
  });

  // Si es product-detail o transition-detail y tenemos un productId (de prop o extraído), usar MemoryRouter para simular la ruta
  const finalProductId = productId || extractedProductId;
  if ((pageState === 'product-detail' || pageState === 'transition-detail') && finalProductId) {
    const detailRoute = `/products/${finalProductId}`;
    console.log(`[TourPageRenderer] 🎯 Renderizando ProductDetailPage con MemoryRouter`);
    console.log(`[TourPageRenderer] 📍 Ruta simulada: ${detailRoute}`);
    console.log(`[TourPageRenderer] 🔑 ID del producto (final): ${finalProductId}`);
    console.log(`[TourPageRenderer] 📊 Estado de página: ${pageState}`);
    console.log(`[TourPageRenderer] 🔢 Paso actual: ${currentStep}`);
    console.log(`[TourPageRenderer] 🔄 RefreshKey: ${refreshKey}`);
    console.log(`[TourPageRenderer] 📋 Configuración del MemoryRouter:`, {
      initialEntries: [detailRoute],
      routePath: '/products/:id',
      productId: finalProductId,
      detailRoute: detailRoute,
      routeMatches: detailRoute.match(/^\/products\/(.+)$/),
      source: productId ? 'prop' : 'extracted-from-route'
    });
    
    return (
      <MemoryRouter 
        initialEntries={[detailRoute]} 
        key={`tour-page-${currentStep}-${pageState}-${refreshKey}-${finalProductId}`}
      >
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  }
  
  // Si necesitamos product-detail pero no tenemos productId, mostrar estado de carga
  if ((pageState === 'product-detail' || pageState === 'transition-detail') && !finalProductId) {
    console.log(`[TourPageRenderer] ⚠️ NO usando MemoryRouter - falta productId`);
    console.log(`[TourPageRenderer] Razón:`, {
      pageState,
      hasProductId: !!productId,
      hasExtractedId: !!extractedProductId,
      productIdValue: productId,
      extractedIdValue: extractedProductId,
      finalProductId: finalProductId,
      route: currentStepData?.route,
      currentStep: currentStep
    });
    console.log(`[TourPageRenderer] ⏳ Esperando productId para renderizar ProductDetailPage...`);
    // Renderizar ProductDetailPage de todas formas - se mostrará "Cargando producto..." hasta que tenga el ID
    // Esto permite que el componente se monte y luego se actualice cuando llegue el productId
    return <PageComponent key={`tour-page-${currentStep}-${pageState}-${refreshKey}-waiting`} />;
  }
  
  // Si es customer-detail o transition-to-customer-detail y tenemos un customerId (de prop o extraído), usar MemoryRouter para simular la ruta
  const finalCustomerId = customerId || extractedCustomerId;
  if ((pageState === 'customer-detail' || pageState === 'transition-to-customer-detail') && finalCustomerId) {
    const detailRoute = `/customers/${finalCustomerId}`;
    console.log(`[TourPageRenderer] 🎯 Renderizando CustomerDetailPage con MemoryRouter`);
    console.log(`[TourPageRenderer] 📍 Ruta simulada: ${detailRoute}`);
    console.log(`[TourPageRenderer] 🔑 ID del cliente (final): ${finalCustomerId}`);
    console.log(`[TourPageRenderer] 📊 Estado de página: ${pageState}`);
    console.log(`[TourPageRenderer] 🔢 Paso actual: ${currentStep}`);
    console.log(`[TourPageRenderer] 🔄 RefreshKey: ${refreshKey}`);
    console.log(`[TourPageRenderer] 📋 Configuración del MemoryRouter:`, {
      initialEntries: [detailRoute],
      routePath: '/customers/:id',
      customerId: finalCustomerId,
      detailRoute: detailRoute,
      routeMatches: detailRoute.match(/^\/customers\/(.+)$/),
      source: customerId ? 'prop' : 'extracted-from-route'
    });
    
    return (
      <MemoryRouter 
        initialEntries={[detailRoute]} 
        key={`tour-page-${currentStep}-${pageState}-${refreshKey}-${finalCustomerId}`}
      >
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  }
  
  // Si necesitamos customer-detail pero no tenemos customerId, mostrar estado de carga
  if ((pageState === 'customer-detail' || pageState === 'transition-to-customer-detail') && !finalCustomerId) {
    console.log(`[TourPageRenderer] ⚠️ NO usando MemoryRouter - falta customerId`);
    console.log(`[TourPageRenderer] Razón:`, {
      pageState,
      hasCustomerId: !!customerId,
      hasExtractedCustomerId: !!extractedCustomerId,
      customerIdValue: customerId,
      extractedCustomerIdValue: extractedCustomerId,
      finalCustomerId: finalCustomerId,
      route: currentStepData?.route,
      currentStep: currentStep
    });
    console.log(`[TourPageRenderer] ⏳ Esperando customerId para renderizar CustomerDetailPage...`);
    // Renderizar CustomerDetailPage de todas formas - se mostrará "Cargando cliente..." hasta que tenga el ID
    // Esto permite que el componente se monte y luego se actualice cuando llegue el customerId
    return <PageComponent key={`tour-page-${currentStep}-${pageState}-${refreshKey}-waiting`} />;
  }
  
  console.log(`[TourPageRenderer] ⚠️ NO usando MemoryRouter - renderizando componente normal`);
  console.log(`[TourPageRenderer] Razón:`, {
    pageState,
    hasProductId: !!productId,
    hasExtractedId: !!extractedProductId,
    productIdValue: productId,
    extractedIdValue: extractedProductId,
    finalProductId: finalProductId,
    route: currentStepData?.route
  });

  // Renderizar solo la página (sin layout, el layout está en OnboardingTourPage)
  // Usar refreshKey en el key para forzar re-render completo cuando cambia la ruta
  return <PageComponent key={`tour-page-${currentStep}-${pageState}-${refreshKey}`} />;
}
