import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
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
import { registerMainAdmin, hasToken } from '@/services/auth.service';
import { triggerCompleteReset } from '@/services/panic.service';
import './ConfigPage.css';

export function ConfigPage() {
  const { config, loading, updateConfiguration, refreshConfiguration } = useConfig();
  const { showToast } = useUI();
  const { currentAdmin, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estados para el formulario de registro del admin principal
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    panicPassword: '',
    confirmPanicPassword: '',
  });
  const [registrationErrors, setRegistrationErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);

  const [formData, setFormData] = useState<UpdateGrowConfigurationRequest>({
    growName: '',
    logoUrl: null,
    primaryColor: '#3bd420',
    showCashDetails: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [_lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  
  // Estados para el easter egg de datos de prueba (solo para admin principal)
  const [_clickCount, setClickCount] = useState(0);
  const [scrollListenerActive, setScrollListenerActive] = useState(false);
  const [loadingTestData, setLoadingTestData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Estados para el easter egg de reset completo (secuencia de colores)
  const [colorSequence, setColorSequence] = useState<string[]>([]);
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Detectar si se requiere registro del admin principal
  useEffect(() => {
    // Si no hay token, siempre mostrar formulario de registro inmediatamente
    if (!hasToken()) {
      setNeedsRegistration(true);
      return;
    }
    
    // Si hay token y configuración, no se requiere registro
    if (hasToken() && config) {
      setNeedsRegistration(false);
    }
  }, [config, loading]);

  // Cargar configuración cuando esté disponible
  useEffect(() => {
    if (config) {
      setFormData({
        growName: config.growName,
        logoUrl: config.logoUrl,
        primaryColor: config.primaryColor,
        showCashDetails: config.showCashDetails,
      });
      setLastSaved(new Date());
      isInitialLoadRef.current = true;
      setNeedsRegistration(false);
    }
  }, [config]);

  // Manejar registro del admin principal
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationErrors({});

    // Validaciones
    const errors: Record<string, string> = {};
    
    if (!registrationData.username || registrationData.username.length < 3) {
      errors.username = 'El usuario debe tener al menos 3 caracteres';
    }
    
    if (!registrationData.password || registrationData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (registrationData.password !== registrationData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (registrationData.panicPassword && registrationData.panicPassword.length < 6) {
      errors.panicPassword = 'La contraseña de pánico debe tener al menos 6 caracteres';
    }
    
    if (registrationData.panicPassword && registrationData.panicPassword === registrationData.password) {
      errors.panicPassword = 'La contraseña de pánico debe ser diferente a la contraseña normal';
    }
    
    if (registrationData.panicPassword !== registrationData.confirmPanicPassword) {
      errors.confirmPanicPassword = 'Las contraseñas de pánico no coinciden';
    }

    if (Object.keys(errors).length > 0) {
      setRegistrationErrors(errors);
      return;
    }

    setIsRegistering(true);

    try {
      await registerMainAdmin(
        registrationData.username,
        registrationData.password,
        registrationData.panicPassword || undefined
      );
      
      showToast('Admin principal registrado exitosamente', 'success');
      await refreshUser();
      await refreshConfiguration();
      setNeedsRegistration(false);
      navigate('/home', { replace: true });
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al registrar el admin principal';
      setRegistrationErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

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
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Función de autoguardado con validación
  const autoSave = useCallback(async (data: UpdateGrowConfigurationRequest) => {
    // Validaciones
    const newErrors: Record<string, string> = {};
    if (!data.growName.trim()) {
      newErrors.growName = 'El nombre de la grow es obligatorio';
    }
    if (!data.primaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      newErrors.primaryColor = 'El color debe estar en formato hexadecimal (#RRGGBB)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      await updateConfiguration(data);
      setLastSaved(new Date());
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
      setIsSaving(false);
    }
  }, [updateConfiguration, showToast]);

  // Autoguardado con debounce
  useEffect(() => {
    // No guardar en la carga inicial o si no hay configuración cargada
    if (isInitialLoadRef.current || !config) {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
      return;
    }

    // Comparar con la configuración actual para evitar guardados innecesarios
    const hasChanges = 
      formData.growName !== config.growName ||
      formData.logoUrl !== config.logoUrl ||
      formData.primaryColor !== config.primaryColor ||
      formData.showCashDetails !== config.showCashDetails;

    if (!hasChanges) {
      return;
    }

    // Limpiar timeout anterior si existe
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Establecer nuevo timeout para guardar después de 1 segundo de inactividad
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(formData);
    }, 1000);

    // Limpiar timeout al desmontar o cuando cambie formData
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, config, autoSave]);

  // Generar paleta de colores para previsualización
  const colorPalette = generateColorPalette(formData.primaryColor);

  // Ejecutar el reset completo
  const executeCompleteReset = useCallback(async () => {
    if (isResetting) return;

    setIsResetting(true);
    setColorSequence([]);

    try {
      showToast('Ejecutando reset completo...', 'info');
      await triggerCompleteReset();
      
      showToast('Reset completo ejecutado exitosamente', 'success');
      
      // Esperar un momento antes de hacer logout
      setTimeout(() => {
        logout();
        navigate('/login', { replace: true });
      }, 1500);
    } catch (error: any) {
      console.error('Error al ejecutar reset completo:', error);
      const errorMessage = error?.message || 'Error al ejecutar reset completo';
      showToast(errorMessage, 'error');
      setIsResetting(false);
    }
  }, [isResetting, showToast, logout, navigate]);

  // Manejar clic en swatch de color para el easter egg
  const handleColorSwatchClick = useCallback((colorType: 'primary' | 'primaryLight' | 'primaryDark') => {
    // Solo activar el easter egg si el usuario está autenticado
    if (!currentAdmin) {
      return;
    }

    // Limpiar timeout anterior si existe
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }

    const newSequence = [...colorSequence, colorType];
    setColorSequence(newSequence);

    // Secuencia esperada: principal → claro → oscuro → oscuro → claro → principal
    const expectedSequence = ['primary', 'primaryLight', 'primaryDark', 'primaryDark', 'primaryLight', 'primary'];
    
    // Verificar si la secuencia coincide
    if (newSequence.length === expectedSequence.length) {
      const matches = newSequence.every((val, idx) => val === expectedSequence[idx]);
      
      if (matches) {
        // Secuencia completa, mostrar confirmación
        const confirmed = window.confirm(
          '⚠️ RESET COMPLETO ⚠️\n\n' +
          'Estás a punto de ejecutar un reset completo de la base de datos.\n\n' +
          'Esto borrará ABSOLUTAMENTE TODO incluyendo:\n' +
          '- Todas las ventas\n' +
          '- Todos los productos\n' +
          '- Todos los clientes\n' +
          '- Todos los administradores\n' +
          '- Toda la configuración\n\n' +
          'Esta operación es IRREVERSIBLE.\n\n' +
          '¿Estás seguro de que quieres continuar?'
        );

        if (confirmed) {
          executeCompleteReset();
        } else {
          setColorSequence([]);
        }
      } else {
        // Secuencia incorrecta, resetear
        setColorSequence([]);
      }
    } else if (newSequence.length > expectedSequence.length) {
      // Secuencia demasiado larga, resetear
      setColorSequence([]);
    } else {
      // Verificar si la secuencia parcial coincide
      const partialMatches = newSequence.every((val, idx) => val === expectedSequence[idx]);
      if (!partialMatches) {
        // Secuencia incorrecta, resetear
        setColorSequence([]);
      } else {
        // Resetear contador después de 3 segundos sin actividad
        sequenceTimeoutRef.current = setTimeout(() => {
          setColorSequence([]);
        }, 3000);
      }
    }
  }, [currentAdmin, colorSequence, colorPalette, executeCompleteReset]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

  // Mostrar formulario de registro si se requiere (no esperar a que termine de cargar si no hay token)
  // Si no hay token, mostrar inmediatamente sin esperar a que termine de cargar
  if (!hasToken()) {
    return (
      <div className="config-page">
        <PageHeader title="Configuración Inicial" />
        <div>
          <FormCard>
            <FormSection title="Registrar Administrador Principal">
              <p className="register-main-admin-info" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                Este es el primer inicio de sesión. Por favor, crea el administrador principal del sistema.
              </p>
              
              {registrationErrors.general && (
                <div className="register-main-admin-error" style={{ 
                  backgroundColor: 'var(--error-bg)', 
                  color: 'var(--error)', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem' 
                }}>
                  {registrationErrors.general}
                </div>
              )}

              <form onSubmit={handleRegister}>
                <Input
                  label="Usuario"
                  type="text"
                  value={registrationData.username}
                  onChange={(e) => setRegistrationData({ ...registrationData, username: e.target.value })}
                  placeholder="Ingresa un usuario"
                  required
                  autoFocus
                  disabled={isRegistering}
                  minLength={3}
                  error={registrationErrors.username}
                  id="register-username"
                />

                <Input
                  label="Contraseña"
                  type="password"
                  value={registrationData.password}
                  onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
                  placeholder="Ingresa una contraseña"
                  required
                  disabled={isRegistering}
                  minLength={6}
                  error={registrationErrors.password}
                  id="register-password"
                />

                <Input
                  label="Confirmar Contraseña"
                  type="password"
                  value={registrationData.confirmPassword}
                  onChange={(e) => setRegistrationData({ ...registrationData, confirmPassword: e.target.value })}
                  placeholder="Confirma la contraseña"
                  required
                  disabled={isRegistering}
                  minLength={6}
                  error={registrationErrors.confirmPassword}
                  id="register-confirm-password"
                />

                <Input
                  label="Contraseña de Pánico"
                  type="password"
                  value={registrationData.panicPassword}
                  onChange={(e) => setRegistrationData({ ...registrationData, panicPassword: e.target.value })}
                  placeholder="Ingresa una contraseña de pánico (opcional)"
                  disabled={isRegistering}
                  minLength={6}
                  error={registrationErrors.panicPassword}
                  id="register-panic-password"
                />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                  Si inicias sesión con esta contraseña, se ejecutará automáticamente el modo pánico (vaciado de tablas).
                </p>

                <Input
                  label="Confirmar Contraseña de Pánico"
                  type="password"
                  value={registrationData.confirmPanicPassword}
                  onChange={(e) => setRegistrationData({ ...registrationData, confirmPanicPassword: e.target.value })}
                  placeholder="Confirma la contraseña de pánico"
                  disabled={isRegistering}
                  minLength={6}
                  error={registrationErrors.confirmPanicPassword}
                  id="register-confirm-panic-password"
                />

                <div className="register-main-admin-actions" style={{ marginTop: '1.5rem' }}>
                  <button
                    type="submit"
                    className="register-main-admin-button"
                    disabled={isRegistering || !registrationData.username || !registrationData.password || !registrationData.confirmPassword}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: isRegistering ? 'not-allowed' : 'pointer',
                      opacity: isRegistering ? 0.6 : 1,
                    }}
                  >
                    {isRegistering ? 'Registrando...' : 'Registrar Admin Principal'}
                  </button>
                </div>
              </form>
            </FormSection>
          </FormCard>
        </div>
      </div>
    );
  }

  if (needsRegistration) {
    return (
      <div className="config-page">
        <PageHeader title="Configuración Inicial" />
        <div>
          <FormCard>
            <FormSection title="Registrar Administrador Principal">
              <p className="register-main-admin-info" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                Este es el primer inicio de sesión. Por favor, crea el administrador principal del sistema.
              </p>
              
              {registrationErrors.general && (
                <div className="register-main-admin-error" style={{ 
                  backgroundColor: 'var(--error-bg)', 
                  color: 'var(--error)', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem' 
                }}>
                  {registrationErrors.general}
                </div>
              )}

              <form onSubmit={handleRegister}>
                <Input
                  label="Usuario"
                  type="text"
                  value={registrationData.username}
                  onChange={(e) => setRegistrationData({ ...registrationData, username: e.target.value })}
                  placeholder="Ingresa un usuario"
                  required
                  autoFocus
                  disabled={isRegistering}
                  minLength={3}
                  error={registrationErrors.username}
                  id="register-username"
                />

                <Input
                  label="Contraseña"
                  type="password"
                  value={registrationData.password}
                  onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
                  placeholder="Ingresa una contraseña"
                  required
                  disabled={isRegistering}
                  minLength={6}
                  error={registrationErrors.password}
                  id="register-password"
                />

                <Input
                  label="Confirmar Contraseña"
                  type="password"
                  value={registrationData.confirmPassword}
                  onChange={(e) => setRegistrationData({ ...registrationData, confirmPassword: e.target.value })}
                  placeholder="Confirma la contraseña"
                  required
                  disabled={isRegistering}
                  minLength={6}
                  error={registrationErrors.confirmPassword}
                  id="register-confirm-password"
                />

                <Input
                  label="Contraseña de Pánico"
                  type="password"
                  value={registrationData.panicPassword}
                  onChange={(e) => setRegistrationData({ ...registrationData, panicPassword: e.target.value })}
                  placeholder="Ingresa una contraseña de pánico (opcional)"
                  disabled={isRegistering}
                  minLength={6}
                  error={registrationErrors.panicPassword}
                  id="register-panic-password"
                />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                  Si inicias sesión con esta contraseña, se ejecutará automáticamente el modo pánico (vaciado de tablas).
                </p>

                <Input
                  label="Confirmar Contraseña de Pánico"
                  type="password"
                  value={registrationData.confirmPanicPassword}
                  onChange={(e) => setRegistrationData({ ...registrationData, confirmPanicPassword: e.target.value })}
                  placeholder="Confirma la contraseña de pánico"
                  disabled={isRegistering}
                  minLength={6}
                  error={registrationErrors.confirmPanicPassword}
                  id="register-confirm-panic-password"
                />

                <div className="register-main-admin-actions" style={{ marginTop: '1.5rem' }}>
                  <button
                    type="submit"
                    className="register-main-admin-button"
                    disabled={isRegistering || !registrationData.username || !registrationData.password || !registrationData.confirmPassword}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: isRegistering ? 'not-allowed' : 'pointer',
                      opacity: isRegistering ? 0.6 : 1,
                    }}
                  >
                    {isRegistering ? 'Registrando...' : 'Registrar Admin Principal'}
                  </button>
                </div>
              </form>
            </FormSection>
          </FormCard>
        </div>
      </div>
    );
  }

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
      <PageHeader title="Configuración" isSaving={isSaving} />
      
      <div>
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
                  <div 
                    className="config-color-swatch"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleColorSwatchClick('primary')}
                    title="Principal"
                  >
                    <div 
                      className="config-color-swatch-color" 
                      style={{ backgroundColor: colorPalette.primary }}
                    />
                    <span>Principal</span>
                  </div>
                  <div 
                    className="config-color-swatch"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleColorSwatchClick('primaryLight')}
                    title="Claro"
                  >
                    <div 
                      className="config-color-swatch-color" 
                      style={{ backgroundColor: colorPalette.primaryLight }}
                    />
                    <span>Claro</span>
                  </div>
                  <div 
                    className="config-color-swatch"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleColorSwatchClick('primaryDark')}
                    title="Oscuro"
                  >
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
        </FormCard>
      </div>
    </div>
  );
}
