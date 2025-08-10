export function buildApiUrl(path: string): string {
  const cleanedPath = path.replace(/^\/?api\/?/, "");
  return import.meta.env.PROD
    ? `/api/${cleanedPath}` // only one /api in production
    : `/${cleanedPath}`;
}
