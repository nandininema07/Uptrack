// api.ts
export function buildApiUrl(path: string): string {
  const cleanedPath = path.replace(/^\/?api\/?/, ""); // remove accidental /api
  return `/api/${cleanedPath}`; // Always hit /api/... in backend
}
