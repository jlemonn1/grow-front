import { HiX, HiCheck, HiRefresh } from 'react-icons/hi';
import { Spinner } from '@/components/common/Spinner';
import styles from '../ImageCropModal.module.css';

interface CropHeaderProps {
  onCancel: () => void;
  onConfirm: () => void;
  onReset: () => void;
  isProcessing: boolean;
  canConfirm: boolean;
  canReset: boolean;
}

export const CropHeader: React.FC<CropHeaderProps> = ({
  onCancel,
  onConfirm,
  onReset,
  isProcessing,
  canConfirm,
  canReset,
}) => (
  <div className={styles.header}>
    <button
      type="button"
      className={styles.btnIcon}
      onClick={onCancel}
      disabled={isProcessing}
      aria-label="Cancelar"
    >
      <HiX />
    </button>

    <h2 className={styles.title}>Recortar Imagen</h2>

    <div className={styles.headerActions}>
      <button
        type="button"
        className={styles.btnIcon}
        onClick={onReset}
        disabled={isProcessing || !canReset}
        aria-label="Resetear"
        title="Resetear"
      >
        <HiRefresh />
      </button>

      <button
        type="button"
        className={`${styles.btnIcon} ${styles.btnConfirm}`}
        onClick={onConfirm}
        disabled={isProcessing || !canConfirm}
        aria-label="Confirmar"
      >
        {isProcessing ? <Spinner size="sm" /> : <HiCheck />}
      </button>
    </div>
  </div>
);
