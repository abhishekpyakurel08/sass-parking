// Color palette matching frontend branding system

export const Colors = {
  // Branding Colors
  primary: '#6366f1', // Indigo
  secondary: '#1e40af', // Dark Blue
  accent: '#8b5cf6', // Purple

  // System Colors
  success: '#10b981', // Green
  error: '#ef4444', // Red
  warning: '#f59e0b', // Amber

  // Dark Mode Colors
  dark: {
    background: '#1a1a1a',
    card: '#2a2a2a',
    elevated: '#333333',
    border: '#333333',
    text: '#ffffff',
    textSecondary: '#888888',
    textMuted: '#666666',
  },

  // Light Mode Colors
  light: {
    background: '#ffffff',
    card: '#f8f9fa',
    elevated: '#ffffff',
    border: '#e5e7eb',
    text: '#1f2937',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
  },

  // Common Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Gradient helper
export const Gradients = {
  primary: ['#6366f1', '#8b5cf6'],
  success: ['#10b981', '#059669'],
  error: ['#ef4444', '#dc2626'],
};
