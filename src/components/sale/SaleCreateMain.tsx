import React, { useState, useEffect } from 'react';

interface SaleCreateMainProps {
  children: React.ReactNode;
}

export const SaleCreateMain: React.FC<SaleCreateMainProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="sale-create-main-mobile">
        {children}
      </div>
    );
  }

  return (
    <div className="sale-create-main">
      {children}
    </div>
  );
};