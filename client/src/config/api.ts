// /client/src/config/api.ts
export function buildApiUrl(path: string): string {
  const cleanedPath = path.replace(/^\/?api\/?/, ""); // remove any accidental /api
  return import.meta.env.PROD
    ? `/${cleanedPath}` // serve directly from domain in production
    : `/api/${cleanedPath}`; // proxy to backend in dev
}
