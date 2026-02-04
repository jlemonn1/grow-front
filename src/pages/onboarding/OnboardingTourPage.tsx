import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/layout/AppLayout';
import { SimpleOnboardingTour } from '@/components/onboarding/SimpleOnboardingTour';
import { TourPageRenderer } from '@/components/onboarding/TourPageRenderer';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { useProducts } from '@/context/products.context';
import { useCustomers } from '@/context/customers.context';

/**
 * Página del tour de onboarding funcional
 * Se muestra dentro del layout de la aplicación para poder navegar por las páginas
 * El tour se renderiza como portal por encima de todo usando el componente simple
 * 
 * Delega el renderizado de páginas al componente TourPageRenderer que maneja
 * la lógica de decisión con estados superiores claros
 * 
 * Easter egg: Si se accede con ?force=true, el tour se reiniciará automáticamente
 * (manejado por useOnboardingTour y SimpleOnboardingTour)
 */
export function OnboardingTourPage() {
  const { currentStepData, currentStep, selectedProductId, selectedCustomerId } = useOnboardingTour();
  const { products, loadProducts, loading: productsLoading } = useProducts();
  const { customers, loadCustomers, loading: customersLoading } = useCustomers();
  const [hasTriedLoading, setHasTriedLoading] = useState(false);
  const [hasTriedLoadingCustomers, setHasTriedLoadingCustomers] = useState(false);
  
  // Determinar si necesitamos un productId para el paso actual
  const needsProductId = useMemo(() => {
    return currentStepData?.route?.includes('/products/:id') || 
           currentStepData?.id === 'transition-to-product-detail' ||
           currentStepData?.id?.startsWith('product-detail');
  }, [currentStepData]);
  
  // Determinar si necesitamos un customerId para el paso actual
  const needsCustomerId = useMemo(() => {
    return currentStepData?.route?.includes('/customers/:id') || 
           currentStepData?.id === 'transition-to-customer-detail' ||
           currentStepData?.id?.startsWith('customer-detail');
  }, [currentStepData]);
  
  // Cargar productos si necesitamos un productId pero no hay productos disponibles
  useEffect(() => {
    if (needsProductId && !selectedProductId && products.length === 0 && !productsLoading && !hasTriedLoading) {
      console.log(`[OnboardingTourPage] 🔄 Necesitamos productId pero no hay productos disponibles, cargando productos...`);
      console.log(`[OnboardingTourPage] Estado antes de cargar:`, {
        needsProductId,
        selectedProductId,
        productsCount: products.length,
        productsLoading,
        hasTriedLoading
      });
      setHasTriedLoading(true);
      loadProducts()
        .then(() => {
          console.log(`[OnboardingTourPage] ✅ Productos cargados exitosamente`);
        })
        .catch((error) => {
          console.error(`[OnboardingTourPage] ❌ Error cargando productos:`, error);
          setHasTriedLoading(false); // Permitir reintentar en caso de error
        });
    }
  }, [needsProductId, selectedProductId, products.length, productsLoading, hasTriedLoading, loadProducts]);
  
  // Resetear el flag cuando cambia el paso y ya no necesitamos productId
  useEffect(() => {
    if (!needsProductId) {
      setHasTriedLoading(false);
    }
  }, [needsProductId]);
  
  // Cargar clientes si necesitamos un customerId pero no hay clientes disponibles
  useEffect(() => {
    if (needsCustomerId && !selectedCustomerId && customers.length === 0 && !customersLoading && !hasTriedLoadingCustomers) {
      console.log(`[OnboardingTourPage] 🔄 Necesitamos customerId pero no hay clientes disponibles, cargando clientes...`);
      console.log(`[OnboardingTourPage] Estado antes de cargar:`, {
        needsCustomerId,
        selectedCustomerId,
        customersCount: customers.length,
        customersLoading,
        hasTriedLoadingCustomers
      });
      setHasTriedLoadingCustomers(true);
      loadCustomers()
        .then(() => {
          console.log(`[OnboardingTourPage] ✅ Clientes cargados exitosamente`);
        })
        .catch((error) => {
          console.error(`[OnboardingTourPage] ❌ Error cargando clientes:`, error);
          setHasTriedLoadingCustomers(false); // Permitir reintentar en caso de error
        });
    }
  }, [needsCustomerId, selectedCustomerId, customers.length, customersLoading, hasTriedLoadingCustomers, loadCustomers]);
  
  // Resetear el flag cuando cambia el paso y ya no necesitamos customerId
  useEffect(() => {
    if (!needsCustomerId) {
      setHasTriedLoadingCustomers(false);
    }
  }, [needsCustomerId]);
  
  // Obtener productId: primero del hook, luego del primer producto del contexto si es necesario
  const productId = useMemo(() => {
    if (selectedProductId) {
      console.log(`[OnboardingTourPage] ✅ Usando selectedProductId del hook: ${selectedProductId}`);
      return selectedProductId;
    }
    
    // Si necesitamos un productId y no está disponible, usar el primer producto del contexto
    if (needsProductId && products.length > 0 && products[0]?.id) {
      console.log(`[OnboardingTourPage] 🔄 Usando primer producto del contexto como fallback:`, {
        productId: products[0].id,
        productName: products[0].name,
        totalProducts: products.length
      });
      return products[0].id;
    }
    
    if (needsProductId) {
      console.log(`[OnboardingTourPage] ⚠️ Necesitamos productId pero no está disponible:`, {
        selectedProductId,
        productsCount: products.length,
        productsLoading,
        hasTriedLoading
      });
    }
    
    return null;
  }, [selectedProductId, needsProductId, products]);
  
  // Obtener customerId: primero del hook, luego del primer cliente del contexto si es necesario
  const customerId = useMemo(() => {
    if (selectedCustomerId) {
      console.log(`[OnboardingTourPage] ✅ Usando selectedCustomerId del hook: ${selectedCustomerId}`);
      return selectedCustomerId;
    }
    
    // Si necesitamos un customerId y no está disponible, usar el primer cliente del contexto
    if (needsCustomerId && customers.length > 0 && customers[0]?.id) {
      console.log(`[OnboardingTourPage] 🔄 Usando primer cliente del contexto como fallback:`, {
        customerId: customers[0].id,
        customerName: customers[0].displayName,
        totalCustomers: customers.length
      });
      return customers[0].id;
    }
    
    if (needsCustomerId) {
      console.log(`[OnboardingTourPage] ⚠️ Necesitamos customerId pero no está disponible:`, {
        selectedCustomerId,
        customersCount: customers.length,
        customersLoading,
        hasTriedLoadingCustomers
      });
    }
    
    return null;
  }, [selectedCustomerId, needsCustomerId, customers]);
  
  // Log para debuggear cambios
  useEffect(() => {
    console.log(`[OnboardingTourPage] ⚡ RE-RENDER - Step: ${currentStep}, Route: ${currentStepData?.route || 'N/A'}, ProductId: ${productId || 'N/A'}, CustomerId: ${customerId || 'N/A'}`);
    console.log(`[OnboardingTourPage] 📊 Estado del ProductId:`, {
      hasProductId: !!productId,
      productIdValue: productId,
      productIdType: typeof productId,
      productIdLength: productId?.length,
      needsProductId: needsProductId,
      selectedProductIdFromHook: selectedProductId,
      productsAvailable: products.length,
      firstProductId: products.length > 0 ? products[0]?.id : null,
      productsLoading: productsLoading,
      hasTriedLoading: hasTriedLoading
    });
    console.log(`[OnboardingTourPage] 📊 Estado del CustomerId:`, {
      hasCustomerId: !!customerId,
      customerIdValue: customerId,
      customerIdType: typeof customerId,
      customerIdLength: customerId?.length,
      needsCustomerId: needsCustomerId,
      selectedCustomerIdFromHook: selectedCustomerId,
      customersAvailable: customers.length,
      firstCustomerId: customers.length > 0 ? customers[0]?.id : null,
      customersLoading: customersLoading,
      hasTriedLoadingCustomers: hasTriedLoadingCustomers
    });
  }, [currentStep, currentStepData, productId, customerId, needsProductId, needsCustomerId, selectedProductId, selectedCustomerId, products, customers, productsLoading, customersLoading, hasTriedLoading, hasTriedLoadingCustomers]);
  
  return (
    <AppLayout>
      <TourPageRenderer currentStep={currentStep} currentStepData={currentStepData} productId={productId} customerId={customerId} />
      <SimpleOnboardingTour />
    </AppLayout>
  );
}
