// api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export function buildApiUrl(path: string): string {
  const cleanedPath = path.replace(/^\/?api\/?/, "");
  return `${API_BASE}/${cleanedPath}`;
}
