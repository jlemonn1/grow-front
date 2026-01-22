import { useRef } from 'react';
import { Input } from '@/components/forms/Input';
import './GlobalSearchInput.css';

interface GlobalSearchInputProps {
  onOpenModal: () => void;
}

export function GlobalSearchInput({ onOpenModal }: GlobalSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    onOpenModal();
  };

  const handleFocus = () => {
    onOpenModal();
  };

  return (
    <div className="global-search-input-container">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Busca lo que quieras..."
        onClick={handleClick}
        onFocus={handleFocus}
        readOnly
        className="global-search-input"
      />
    </div>
  );
}
