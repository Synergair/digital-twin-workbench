/**
 * Resolves asset paths relative to Vite's base URL.
 * In dev: BASE_URL = "/" → paths stay as-is
 * In prod: BASE_URL = "/digital-twin/" → paths get prefixed
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const cleanPath = path.replace(/^\//, '');
  return `${base}${cleanPath}`;
}
