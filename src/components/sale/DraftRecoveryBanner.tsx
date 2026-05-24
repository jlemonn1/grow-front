import { useEffect, useRef, useState } from 'react';
import { HiOutlineInformationCircle, HiX } from 'react-icons/hi';
import type { SaleDraft } from '@/types/models';
import './DraftRecoveryBanner.css';

interface DraftRecoveryBannerProps {
  isVisible: boolean;
  draft: SaleDraft | null;
  onRecover: () => void;
  onDiscard: () => void;
}

const AUTO_DISMISS_MS = 10000;

export function DraftRecoveryBanner({ isVisible, draft, onRecover, onDiscard }: DraftRecoveryBannerProps) {
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(100);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, AUTO_DISMISS_MS - elapsed);
      const pct = (remaining / AUTO_DISMISS_MS) * 100;
      setProgress(pct);
    }, 100);

    timerRef.current = setTimeout(() => {
      onDiscard();
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isVisible, onDiscard]);

  const handleRecover = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onRecover();
  };

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onDiscard();
  };

  if (!isVisible || !draft) return null;

  const itemsCount = draft.items.length;
  const totalGrams = draft.items.reduce((sum, item) => sum + item.grams, 0);
  const hasCustomer = !!draft.customerId;

  let message = `Borrador guardado: ${itemsCount} ${itemsCount === 1 ? 'producto' : 'productos'}`;
  if (totalGrams > 0) {
    message += `, ${totalGrams.toFixed(2)}g`;
  }
  if (hasCustomer) {
    message += ', socio seleccionado';
  }

  return (
    <div className="draft-recovery-banner" role="status" aria-live="polite">
      <div className="draft-recovery-banner-content">
        <HiOutlineInformationCircle className="draft-recovery-banner-icon" aria-hidden="true" />
        <span className="draft-recovery-banner-text">{message}</span>
        <button
          type="button"
          className="draft-recovery-banner-recover"
          onClick={handleRecover}
        >
          Recuperar
        </button>
        <button
          type="button"
          className="draft-recovery-banner-close"
          onClick={handleDismiss}
          aria-label="Descartar borrador"
        >
          <HiX aria-hidden="true" />
        </button>
      </div>
      <div
        className="draft-recovery-banner-progress"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
    </div>
  );
}
