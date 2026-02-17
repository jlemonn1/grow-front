import type { ProductMeasurementType } from '@/types/models';

export const MEASUREMENT_SHORT_LABELS: Record<ProductMeasurementType, string> = {
  WEIGHT: 'g',
  UNIT: 'ud',
};

export const MEASUREMENT_LONG_LABELS: Record<ProductMeasurementType, string> = {
  WEIGHT: 'gramo',
  UNIT: 'unidad',
};

export const getMeasurementShortLabel = (type?: ProductMeasurementType) => (
  type ? MEASUREMENT_SHORT_LABELS[type] : MEASUREMENT_SHORT_LABELS.WEIGHT
);

export const getMeasurementLongLabel = (type?: ProductMeasurementType) => (
  type ? MEASUREMENT_LONG_LABELS[type] : MEASUREMENT_LONG_LABELS.WEIGHT
);

export const getPriceLabel = (type?: ProductMeasurementType) => (
  type === 'UNIT' ? 'Precio/unidad' : 'Precio/gramo'
);

export const getQuantityLabel = (type?: ProductMeasurementType) => (
  type === 'UNIT' ? 'Unidades' : 'Gramos'
);
