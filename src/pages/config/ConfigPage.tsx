import { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { FormCard } from '@/components/forms/FormCard';
import { FormSection } from '@/components/forms/FormSection';
import { Spinner } from '@/components/common/Spinner';
import { ImageUpload } from '@/components/product/ImageUpload';
import { useConfig } from '@/context/config.context';
import { useUI } from '@/context/ui.context';
import type { UpdateGrowConfigurationRequest } from '@/services/config.service';
import type { ValidationError } from '@/types/api';
import { generateColorPalette } from '@/utils/colorSystem';
import { customersService } from '@/services/customers.service';
import { createProduct } from '@/services/products.service';
import { createSale } from '@/services/sales.service';
import { listCategories, createCategory } from '@/services/categories.service';
import type { CreateCustomerRequest, CreateProductRequest, CreateSaleRequest } from '@/types/models';
import { useAuth } from '@/context/auth.context';
import './ConfigPage.css';

export function ConfigPage() {
  const { config, loading, updateConfiguration } = useConfig();
  const { showToast } = useUI();
  const { currentAdmin } = useAuth();

  const [formData, setFormData] = useState<UpdateGrowConfigurationRequest>({
    growName: '',
    logoUrl: null,
    primaryColor: '#3bd420',
    showCashDetails: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estados para el easter egg (solo para admin principal)
  const [clickCount, setClickCount] = useState(0);
  const [scrollListenerActive, setScrollListenerActive] = useState(false);
  const [loadingTestData, setLoadingTestData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Cargar configuración cuando esté disponible
  useEffect(() => {
    if (config) {
      setFormData({
        growName: config.growName,
        logoUrl: config.logoUrl,
        primaryColor: config.primaryColor,
        showCashDetails: config.showCashDetails,
      });
      setHasChanges(false);
    }
  }, [config]);

  // Función para cargar datos de prueba (solo para admin principal)
  const loadTestData = useCallback(async () => {
    // Verificar que sea admin principal
    if (!currentAdmin?.isMainAdmin) {
      return;
    }
    
    if (loadingTestData || dataLoaded) return;
    
    setLoadingTestData(true);
    setScrollListenerActive(false);
    showToast('Cargando datos de prueba...', 'info');

    try {
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

      setDataLoaded(true);
      showToast(
        `¡Easter egg activado! Se crearon ${createdCustomers.length} clientes, ${createdProducts.length} productos y ${sales.length} ventas.`,
        'success'
      );
    } catch (error) {
      console.error('Error cargando datos de prueba:', error);
      showToast('Error al cargar datos de prueba', 'error');
      setScrollListenerActive(false);
    } finally {
      setLoadingTestData(false);
    }
  }, [currentAdmin, loadingTestData, dataLoaded, showToast]);

  // Usar refs para mantener los valores actuales sin depender del closure
  const scrollListenerActiveRef = useRef(false);
  const loadingTestDataRef = useRef(false);
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    scrollListenerActiveRef.current = scrollListenerActive;
  }, [scrollListenerActive]);

  useEffect(() => {
    loadingTestDataRef.current = loadingTestData;
  }, [loadingTestData]);

  useEffect(() => {
    dataLoadedRef.current = dataLoaded;
  }, [dataLoaded]);

  // Detectar clics en el título (solo para admin principal)
  useEffect(() => {
    // Solo activar el easter egg si es admin principal y no se han cargado datos
    if (!currentAdmin?.isMainAdmin || dataLoaded) return;
    
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let titleElement: HTMLElement | null = null;

    const handleTitleClick = (e: MouseEvent) => {
      e.stopPropagation();
      setClickCount((prev) => {
        const newCount = prev + 1;
        console.log('Click en título detectado, contador:', newCount);
        if (newCount === 3) {
          console.log('¡3 clics alcanzados! La luz roja debería aparecer. Haz un cuarto clic para activar.');
          setScrollListenerActive(true);
        } else if (newCount >= 4) {
          // Usar los refs para tener los valores actuales
          if (scrollListenerActiveRef.current && !loadingTestDataRef.current && !dataLoadedRef.current) {
            console.log('¡Cuarto clic! Activando carga de datos...');
            loadTestData();
          } else {
            console.log('Cuarto clic detectado pero condiciones no cumplidas:', {
              scrollActive: scrollListenerActiveRef.current,
              loading: loadingTestDataRef.current,
              loaded: dataLoadedRef.current
            });
          }
        }
        return newCount;
      });
    };

    // Esperar a que el DOM esté listo antes de buscar el elemento
    const findAndAttachListener = () => {
      titleElement = document.querySelector('.page-header-title') as HTMLElement;
      if (!titleElement) {
        // Si no se encuentra, intentar de nuevo después de un breve delay
        timeoutId = setTimeout(findAndAttachListener, 100);
        return;
      }

      console.log('Listener de clics agregado al título');
      titleElement.addEventListener('click', handleTitleClick);
    };

    findAndAttachListener();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (titleElement) {
        titleElement.removeEventListener('click', handleTitleClick);
      }
    };
  }, [currentAdmin, dataLoaded, scrollListenerActive, loadingTestData, loadTestData]);

  // Mantener los refs actualizados (ya no necesitamos el listener de scroll)

  const handleChange = useCallback((field: keyof UpdateGrowConfigurationRequest, value: string | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const newErrors: Record<string, string> = {};
    if (!formData.growName.trim()) {
      newErrors.growName = 'El nombre de la grow es obligatorio';
    }
    if (!formData.primaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      newErrors.primaryColor = 'El color debe estar en formato hexadecimal (#RRGGBB)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await updateConfiguration(formData);
      showToast('Configuración guardada exitosamente', 'success');
      setHasChanges(false);
    } catch (error) {
      if ((error as ValidationError).fieldErrors) {
        const fieldErrors = (error as ValidationError).fieldErrors || {};
        const errorsMap: Record<string, string> = {};
        Object.keys(fieldErrors).forEach((key) => {
          if (fieldErrors[key] && fieldErrors[key].length > 0) {
            errorsMap[key] = fieldErrors[key][0];
          }
        });
        setErrors(errorsMap);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Error al guardar configuración';
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, updateConfiguration, showToast]);

  // Generar paleta de colores para previsualización
  const colorPalette = generateColorPalette(formData.primaryColor);

  if (loading) {
    return (
      <div className="config-page">
        <PageHeader title="Configuración" />
        <div className="config-page-loading">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="config-page">
      <PageHeader title="Configuración" />
      
      {/* Indicador visual del easter egg (luz roja discreta) */}
      {currentAdmin?.isMainAdmin && clickCount >= 3 && !dataLoaded && (
        <div className="easter-egg-indicator" title="Easter egg activado - Haz un cuarto clic en el título para cargar datos de prueba">
          <div className="easter-egg-light"></div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <FormCard>
          <FormSection title="Identidad">
            <Input
              label="Nombre de la grow"
              value={formData.growName}
              onChange={(e) => handleChange('growName', e.target.value)}
              error={errors.growName}
              required
              id="growName"
            />

            <div className="form-field">
              <label className="form-label">Logo</label>
              <ImageUpload
                value={formData.logoUrl || undefined}
                onChange={(url) => handleChange('logoUrl', url || null)}
              />
            </div>
          </FormSection>

          <FormSection title="Apariencia">
            <div className="form-field">
              <label htmlFor="primaryColor" className="form-label">
                Color principal
              </label>
              <div className="config-color-selector">
                <input
                  type="color"
                  id="primaryColor"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="config-color-input"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  error={errors.primaryColor}
                  placeholder="#3bd420"
                  required
                  id="primaryColorHex"
                />
              </div>
              <p className="config-color-info">
                El color se guardará y estará disponible para personalización futura.
              </p>
              
              {/* Previsualización de paleta */}
              <div className="config-color-preview">
                <h4>Vista previa de colores generados:</h4>
                <div className="config-color-swatches">
                  <div className="config-color-swatch">
                    <div 
                      className="config-color-swatch-color" 
                      style={{ backgroundColor: colorPalette.primary }}
                    />
                    <span>Principal</span>
                  </div>
                  <div className="config-color-swatch">
                    <div 
                      className="config-color-swatch-color" 
                      style={{ backgroundColor: colorPalette.primaryLight }}
                    />
                    <span>Claro</span>
                  </div>
                  <div className="config-color-swatch">
                    <div 
                      className="config-color-swatch-color" 
                      style={{ backgroundColor: colorPalette.primaryDark }}
                    />
                    <span>Oscuro</span>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Privacidad y visualización">
            <div className="form-field">
              <label className="form-label">
                Mostrar detalles de efectivo en las ventas
              </label>
              <div className="config-toggle">
                <button
                  type="button"
                  className={`config-toggle-button ${formData.showCashDetails ? 'active' : ''}`}
                  onClick={() => handleChange('showCashDetails', !formData.showCashDetails)}
                >
                  <span className="config-toggle-slider" />
                </button>
                <span className="config-toggle-label">
                  {formData.showCashDetails ? 'Mostrar' : 'Ocultar'} dinero entregado y cambio
                </span>
              </div>
              <p className="config-toggle-description">
                Cuando está desactivado, solo se muestra el total de la venta. 
                El efectivo recibido y el cambio quedan ocultos en la UI, tickets y reportes.
              </p>
            </div>
          </FormSection>

          <div className="config-actions">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!hasChanges}
            >
              Guardar cambios
            </Button>
          </div>
        </FormCard>
      </form>
    </div>
  );
}
