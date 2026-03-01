import { memo } from 'react';
import type { Product } from '@/types/models';
import { ProductPickerCard } from './ProductPickerCard';

interface ProductPickerGridProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelect: (product: Product) => void;
}

const ProductPickerGridComponent = ({ products, selectedProduct, onSelect }: ProductPickerGridProps) => {
  return (
    <div className="product-picker-grid" role="listbox">
      {products.map((product) => (
        <ProductPickerCard
          key={product.id}
          product={product}
          isSelected={selectedProduct?.id === product.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

ProductPickerGridComponent.displayName = 'ProductPickerGridComponent';

export const ProductPickerGrid = memo(ProductPickerGridComponent);
