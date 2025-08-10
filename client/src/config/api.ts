// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Helper function to build full API URLs
export function buildApiUrl(path: string): string {
  if (API_BASE_URL) {
    // Production: use full URL
    return `${API_BASE_URL}${path}`;
  } else {
    // Development: use relative path (Vite proxy will handle it)
    return path;
  }
}
