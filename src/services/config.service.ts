import { get, patch } from './http';

export interface GrowConfiguration {
  id: string;
  growName: string;
  logoUrl: string | null;
  primaryColor: string;
  showCashDetails: boolean;
  enableCustomerBalance: boolean;
  themeMode: 'light' | 'dark' | 'system';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGrowConfigurationRequest {
  growName: string;
  logoUrl: string | null;
  primaryColor: string;
  showCashDetails: boolean;
  enableCustomerBalance: boolean;
  themeMode?: 'light' | 'dark' | 'system';
}

export const configService = {
  /**
   * Obtiene la configuración actual de la grow
   */
  async getConfiguration(): Promise<GrowConfiguration> {
    return get<GrowConfiguration>('/config');
  },

  /**
   * Actualiza la configuración de la grow
   */
  async updateConfiguration(data: UpdateGrowConfigurationRequest): Promise<GrowConfiguration> {
    return patch<GrowConfiguration>('/config', data);
  },
};
