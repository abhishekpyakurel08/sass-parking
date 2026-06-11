import { api } from './api';

// Default Forest Glass colors
const defaultBranding = {
  primaryColor: '#34D399',
  secondaryColor: '#10B981',
  accentColor: '#0B0F0E',
  logoUrl: undefined as string | undefined,
};

let currentBranding = { ...defaultBranding };

export const brandingService = {
  getBranding: () => currentBranding,
  
  fetchBranding: async () => {
    try {
      const res = await api.get('/branding');
      const brandingData = res.data.data.branding;
      currentBranding = {
        primaryColor: brandingData.primaryColor || defaultBranding.primaryColor,
        secondaryColor: brandingData.secondaryColor || defaultBranding.secondaryColor,
        accentColor: brandingData.accentColor || defaultBranding.accentColor,
        logoUrl: brandingData.logoUrl,
      };
      return currentBranding;
    } catch (error) {
      console.error('Failed to fetch branding:', error);
      return defaultBranding;
    }
  },
  
  resetToDefault: () => {
    currentBranding = { ...defaultBranding };
  },
};
