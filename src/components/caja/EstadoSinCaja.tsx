import { Button } from '@/components/common/Button';
import { useUI } from '@/context/ui.context';
import { cajaService } from '@/services/caja/caja.service';
import { HiOutlineCurrencyEuro } from 'react-icons/hi';
import './EstadoSinCaja.css';

interface EstadoSinCajaProps {
  onInicializar: () => void;
  loading?: boolean;
}

export function EstadoSinCaja({ onInicializar, loading = false }: EstadoSinCajaProps) {
  const { showToast } = useUI();

  const handleInicializar = async () => {
    try {
      await cajaService.inicializarPrimeraCaja();
      showToast('Primera caja creada exitosamente', 'success');
      onInicializar();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || 'Error al crear primera caja',
        'error'
      );
    }
  };

  return (
    <div className="estado-sin-caja">
      <div className="estado-sin-caja-icon">
        <HiOutlineCurrencyEuro size={64} />
      </div>
      
      <h2 className="estado-sin-caja-title">
        Sistema de Cajas no Inicializado
      </h2>
      
      <p className="estado-sin-caja-description">
        Aún no existe ninguna caja en el sistema. Para comenzar a operar,
        debes crear la primera caja con un saldo inicial de 0€.
      </p>
      
      <p className="estado-sin-caja-hint">
        Podrás añadir dinero posteriormente usando la función de "Ajuste de Entrada".
      </p>

      <Button
        variant="primary"
        size="large"
        onClick={handleInicializar}
        loading={loading}
        className="estado-sin-caja-button"
      >
        Crear Primera Caja (0€)
      </Button>
    </div>
  );
}
