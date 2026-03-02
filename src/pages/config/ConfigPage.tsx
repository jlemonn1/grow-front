import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Input';
import { FormCard } from '@/components/forms/FormCard';
import { FormSection } from '@/components/forms/FormSection';
import { Spinner } from '@/components/common/Spinner';
import { Modal } from '@/components/common/Modal';
import { ImageUpload } from '@/components/product/ImageUpload';
import { useConfig } from '@/context/config.context';
import { useUI } from '@/context/ui.context';
import type { UpdateGrowConfigurationRequest } from '@/services/config.service';
import type { ValidationError } from '@/types/api';
import { generateColorPalette } from '@/utils/colorSystem';
import { useColorAccessibility } from '@/hooks/useColorAccessibility';
import { useAuth } from '@/context/auth.context';
import { registerMainAdmin, hasToken } from '@/services/auth.service';
import { triggerCompleteReset } from '@/services/panic.service';
import './ConfigPage.css';

export function ConfigPage() {
  const { config, loading, updateConfiguration, refreshConfiguration, needsFunctionalOnboarding, needsOnboarding, quickSaleMode, setQuickSaleMode, setThemeMode } = useConfig();
  const { showToast } = useUI();
  const { currentAdmin, refreshUser, logout } = useAuth();
  const { mode: colorAccessibilityMode, isAccessibilityMode } = useColorAccessibility();
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
    enableCustomerBalance: true,
    themeMode: 'system',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [_lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  
  // Estados para el easter egg de reset completo (secuencia de colores)
  const [colorSequence, setColorSequence] = useState<string[]>([]);
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Estados para confirmación de desactivación de saldo
  const [showDisableBalanceConfirm, setShowDisableBalanceConfirm] = useState(false);
  const [pendingBalanceValue, setPendingBalanceValue] = useState<boolean | null>(null);

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
        enableCustomerBalance: config.enableCustomerBalance ?? true,
        themeMode: config.themeMode ?? 'system',
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
      
      // Esperar un momento para que el contexto se actualice después de refreshConfiguration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar necesidades de onboarding y redirigir apropiadamente
      if (needsFunctionalOnboarding) {
        navigate('/onboarding/tour', { replace: true });
      } else if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al registrar el admin principal';
      setRegistrationErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleChange = useCallback((field: keyof UpdateGrowConfigurationRequest, value: string | boolean | null | undefined) => {
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

  // Manejar cambio del toggle de saldo con confirmación
  const handleBalanceToggleChange = useCallback((newValue: boolean) => {
    if (newValue === false && formData.enableCustomerBalance === true) {
      // Intentar desactivar: mostrar confirmación
      setPendingBalanceValue(false);
      setShowDisableBalanceConfirm(true);
    } else if (newValue === true) {
      // Activar directamente
      setFormData((prev) => ({ ...prev, enableCustomerBalance: true }));
    }
  }, [formData.enableCustomerBalance]);

  // Confirmar desactivación de saldo
  const confirmDisableBalance = useCallback(() => {
    if (pendingBalanceValue === false) {
      setFormData((prev) => ({ ...prev, enableCustomerBalance: false }));
    }
    setShowDisableBalanceConfirm(false);
    setPendingBalanceValue(null);
  }, [pendingBalanceValue]);

  // Cancelar desactivación de saldo
  const cancelDisableBalance = useCallback(() => {
    setShowDisableBalanceConfirm(false);
    setPendingBalanceValue(null);
  }, []);

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
      formData.showCashDetails !== config.showCashDetails ||
      formData.enableCustomerBalance !== config.enableCustomerBalance ||
      formData.themeMode !== (config.themeMode ?? 'system');

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
          '- Todas las dispensaciones\n' +
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
                {isAccessibilityMode ? (
                  <>
                    <h4 style={{ color: 'var(--color-warning)' }}>
                      ⚠️ Modo de accesibilidad activo: {colorAccessibilityMode}
                    </h4>
                    <p className="config-color-info" style={{ color: 'var(--color-text-secondary)' }}>
                      El color del growshop está siendo ignorado. Se está usando el color del modo de accesibilidad.
                    </p>
                    <div className="config-color-swatches">
                      <div className="config-color-swatch">
                        <div 
                          className="config-color-swatch-color" 
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        />
                        <span>Color aplicado</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            <div className="form-field" style={{ marginTop: '2rem' }}>
              <label className="form-label">
                Tema de la aplicación
              </label>
              <div className="config-radio-group">
                <label className="config-radio-option">
                  <input
                    type="radio"
                    name="themeMode"
                    value="system"
                    checked={formData.themeMode === 'system'}
                    onChange={() => {
                      handleChange('themeMode', 'system');
                      setThemeMode('light');
                    }}
                  />
                  <span className="config-radio-label">
                    <strong>Automático</strong>
                    <span className="config-radio-description">
                      Seguir el tema del sistema (claro u oscuro según configuración del dispositivo)
                    </span>
                  </span>
                </label>
                <label className="config-radio-option">
                  <input
                    type="radio"
                    name="themeMode"
                    value="light"
                    checked={formData.themeMode === 'light'}
                    onChange={() => handleChange('themeMode', 'light')}
                  />
                  <span className="config-radio-label">
                    <strong>Claro</strong>
                    <span className="config-radio-description">
                      Siempre usar tema claro
                    </span>
                  </span>
                </label>
                <label className="config-radio-option">
                  <input
                    type="radio"
                    name="themeMode"
                    value="dark"
                    checked={formData.themeMode === 'dark'}
                    onChange={() => handleChange('themeMode', 'dark')}
                  />
                  <span className="config-radio-label">
                    <strong>Oscuro</strong>
                    <span className="config-radio-description">
                      Siempre usar tema oscuro
                    </span>
                  </span>
                </label>
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

            <div className="form-field" style={{ marginTop: '2rem' }}>
              <label className="form-label">
                Comportamiento del botón de venta rápida
              </label>
              <div className="config-radio-group">
                <label className="config-radio-option">
                  <input
                    type="radio"
                    name="quickSaleMode"
                    value="modal"
                    checked={quickSaleMode === 'modal'}
                    onChange={() => setQuickSaleMode('modal')}
                  />
                  <span className="config-radio-label">
                    <strong>Modal</strong>
                    <span className="config-radio-description">
                      Abre el proceso de venta en un modal flotante
                    </span>
                  </span>
                </label>
                <label className="config-radio-option">
                  <input
                    type="radio"
                    name="quickSaleMode"
                    value="redirect"
                    checked={quickSaleMode === 'redirect'}
                    onChange={() => setQuickSaleMode('redirect')}
                  />
                  <span className="config-radio-label">
                    <strong>Redirigir a página</strong>
                    <span className="config-radio-description">
                      Redirige a la página completa de dispensar (/sales/new)
                    </span>
                  </span>
                </label>
              </div>
              <p className="config-toggle-description">
                Elige cómo quieres que funcione el botón flotante de venta rápida.
              </p>
            </div>
          </FormSection>

          {currentAdmin?.isMainAdmin && (
            <FormSection title="Funcionalidades">
              <div className="form-field">
                <label className="form-label">
                  Usar saldo de socios
                </label>
                <div className="config-toggle">
                  <button
                    type="button"
                    className={`config-toggle-button ${formData.enableCustomerBalance ? 'active' : ''}`}
                    onClick={() => handleBalanceToggleChange(!formData.enableCustomerBalance)}
                  >
                    <span className="config-toggle-slider" />
                  </button>
                  <span className="config-toggle-label">
                    {formData.enableCustomerBalance ? 'Activado' : 'Desactivado'}
                  </span>
                </div>
                <p className="config-toggle-description">
                  {formData.enableCustomerBalance 
                    ? 'Los socios pueden usar su saldo para pagar, guardar cambio y transferir saldo.'
                    : 'Al desactivar, no se puede usar ni guardar saldo. Los socios con saldo existente podrán verlo pero no usarlo, y solo se permitirá vaciarlo.'}
                </p>
              </div>
            </FormSection>
          )}
        </FormCard>
      </div>

      {/* Modal de confirmación para desactivar saldo */}
      <Modal
        isOpen={showDisableBalanceConfirm}
        onClose={cancelDisableBalance}
        title="Desactivar saldo de socios"
      >
        <div style={{ textAlign: 'left' }}>
          <p style={{ marginBottom: '1rem' }}>
            <strong>⚠️ Esta acción afecta inmediatamente todas las ventas.</strong>
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            Al desactivar el saldo:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>No se podrá usar saldo de clientes en ventas</li>
            <li>No se guardará cambio en saldo</li>
            <li>No se podrán transferir saldos entre clientes</li>
          </ul>
          <p style={{ marginBottom: '0.5rem' }}>
            Los socios con saldo existente:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Podrán seguir viendo su saldo (solo lectura)</li>
            <li>NO podrán usar el saldo</li>
            <li>Solo se permitirá vaciar el saldo desde el perfil del socio</li>
          </ul>
          <p style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--warning-bg)', 
            color: 'var(--warning)', 
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
          }}>
            Esta acción se puede revertir reactivando el saldo más adelante.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={cancelDisableBalance}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmDisableBalance}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: 'var(--color-danger, #dc3545)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Desactivar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
