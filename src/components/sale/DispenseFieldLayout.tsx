import { ReactNode } from 'react';
import './DispenseFieldLayout.css';

interface DispenseFieldLayoutProps {
  children: ReactNode;
  shortcuts: ReactNode;
}

export function DispenseFieldLayout({ children, shortcuts }: DispenseFieldLayoutProps) {
  return (
    <div className="dispense-field-layout">
      <div className="dispense-field-layout-input">
        {children}
      </div>
      <div className="dispense-field-layout-shortcuts">
        {shortcuts}
      </div>
    </div>
  );
}
