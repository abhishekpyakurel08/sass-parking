
export const extractSubdomain = (host: string): string | null => {
  if (!host) return null;
  
  // Handle localhost or IP addresses
  if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }
  
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // Split by dots
  const parts = hostname.split('.');
  
  // If we have more than 2 parts, the first part is the subdomain
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
};

/**
 * Normalize tenant slug for consistent comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes special characters (keeps only alphanumeric and hyphens)
 */
export const normalizeSlug = (slug: string): string => {
  if (!slug) return '';
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Validate tenant slug format
 * - Must be 3-50 characters
 * - Only alphanumeric and hyphens
 * - Must start and end with alphanumeric
 */
export const validateSlug = (slug: string): { valid: boolean; error?: string } => {
  if (!slug) {
    return { valid: false, error: 'Slug is required' };
  }
  
  const normalized = normalizeSlug(slug);
  
  if (normalized.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters' };
  }
  
  if (normalized.length > 50) {
    return { valid: false, error: 'Slug must not exceed 50 characters' };
  }
  
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalized)) {
    return { valid: false, error: 'Slug must start and end with alphanumeric characters and contain only alphanumeric and hyphens' };
  }
  
  return { valid: true };
};

/**
 * Check if a host is a subdomain
 */
export const isSubdomain = (host: string): boolean => {
  return extractSubdomain(host) !== null;
};


export const getBaseDomain = (host: string): string => {
  if (!host) return '';
  
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');
  
  if (parts.length > 2) {
    return parts.slice(1).join('.');
  }
  
  return hostname;
};
