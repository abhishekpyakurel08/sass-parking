import { api } from './api';

// Default colors matching frontend branding palette
const defaultBranding = {
  primaryColor: '#6366f1', // Indigo
  secondaryColor: '#1e40af', // Dark Blue
  accentColor: '#8b5cf6', // Purple
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
