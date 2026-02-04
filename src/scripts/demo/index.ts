import { salesNewScript } from './salesNew.script';
import { salesScript } from './sales.script';
import { productsScript } from './products.script';
import { customersScript } from './customers.script';
import { reportsScript } from './reports.script';
import { adminsScript } from './admins.script';
import type { DemoScript } from '@/types/demo.types';

/**
 * Todos los scripts de demostración disponibles
 */
export const demoScripts: Record<string, DemoScript> = {
  salesNew: salesNewScript,
  sales: salesScript,
  products: productsScript,
  customers: customersScript,
  reports: reportsScript,
  admins: adminsScript,
};

/**
 * Obtiene un script por su nombre
 */
export function getDemoScript(name: string): DemoScript | undefined {
  return demoScripts[name];
}

/**
 * Lista todos los nombres de scripts disponibles
 */
export function getDemoScriptNames(): string[] {
  return Object.keys(demoScripts);
}

/**
 * Exportaciones individuales para facilitar imports
 */
export {
  salesNewScript,
  salesScript,
  productsScript,
  customersScript,
  reportsScript,
  adminsScript,
};
