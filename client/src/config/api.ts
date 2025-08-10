// src/config/api.ts
export function buildApiUrl(path: string) {
  let baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Ensure baseUrl ends with a slash and path does not start with a slash
  if (baseUrl.endsWith('/') && path.startsWith('/')) {
    path = path.slice(1);
  }

  return `${baseUrl}${path}`;
}
