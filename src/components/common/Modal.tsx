import { useEffect, useRef, ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  // Mantener onClose actualizado en el ref para evitar dependencias
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Efecto para establecer focus inicial solo cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;

    // Guardar el elemento activo antes de abrir el modal
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus en el primer elemento focusable del modal
    // Priorizar elementos con autoFocus
    const timeoutId = setTimeout(() => {
      if (!modalRef.current) return;
      
      // Buscar primero elementos con autoFocus
      const autoFocusElement = modalRef.current.querySelector<HTMLElement>(
        'input[autofocus], textarea[autofocus], select[autofocus], [autofocus]'
      );
      
      if (autoFocusElement) {
        // Si hay un elemento con autoFocus, esperar un poco más para que React lo procese
        setTimeout(() => {
          // Solo hacer focus si el elemento aún existe y el modal sigue abierto
          if (modalRef.current && isOpen) {
            autoFocusElement.focus();
          }
        }, 10);
      } else {
        // Si no hay autoFocus, hacer focus en el primer elemento focusable (excluyendo botones de cerrar)
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstInput = focusableElements[0];
        if (firstInput) {
          firstInput.focus();
        } else {
          // Si no hay inputs, entonces hacer focus en el primer botón (excluyendo cerrar)
          const firstButton = modalRef.current.querySelector<HTMLElement>(
            'button:not(.modal-close), [href]'
          );
          firstButton?.focus();
        }
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen]); // Solo depende de isOpen, no de onClose

  // Efecto separado para los event listeners
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      // Restaurar focus al elemento anterior cuando se cierra
      previousActiveElement.current?.focus();
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    // Focus trap: mantener el focus dentro del modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = '';
    };
  }, [isOpen]); // Solo depende de isOpen

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div ref={modalRef} className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          {showCloseButton && (
            <button 
              className="modal-close" 
              onClick={onClose} 
              aria-label="Cerrar"
              type="button"
            >
              ×
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
