import { HiRefresh } from 'react-icons/hi';
import { Button } from '@/components/common/Button';
import styles from '../ImageCropModal.module.css';

interface CropFooterProps {
  onRotate: () => void;
  zoom: number;
  isProcessing: boolean;
}

export const CropFooter: React.FC<CropFooterProps> = ({
  onRotate,
  zoom,
  isProcessing,
}) => (
  <div className={styles.footer}>
    <Button
      type="button"
      variant="secondary"
      size="small"
      onClick={onRotate}
      disabled={isProcessing}
      icon={<HiRefresh />}
    >
      Rotar
    </Button>
    <span className={styles.zoomIndicator}>{Math.round(zoom * 100)}%</span>
  </div>
);
