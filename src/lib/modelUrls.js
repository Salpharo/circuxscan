/**
 * Resolve QR / manual input into a hosted GLB URL or an in-app library id.
 * Supports full URLs, ./3Dmodels/... , /3Dmodels/... , and /3dmodellibrary/:id links.
 * @param {string} raw
 * @returns {{ type: 'url', url: string } | { type: 'library', modelId: string } | null}
 */
export function resolveScanPayload(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  const abs = (path) => {
    const p = path.startsWith('/') ? path : `/${path}`;
    const joined = `${basePath}${p}`.replace(/\/{2,}/g, '/');
    return new URL(joined, origin).href;
  };

  let asUrl = null;
  try {
    asUrl = new URL(t, origin);
  } catch {
    return null;
  }

  const path = (asUrl.pathname || '/').replace(/\/$/, '') || '/';
  const libMatch = path.match(/\/3dmodellibrary\/([^/]+)$/i);
  if (libMatch) {
    return { type: 'library', modelId: decodeURIComponent(libMatch[1]) };
  }

  if (/\.(glb|gltf)(\?|#|$)/i.test(asUrl.pathname)) {
    return { type: 'url', url: asUrl.href };
  }

  if (/^https?:\/\//i.test(t)) {
    return { type: 'url', url: t };
  }

  const rel = t.replace(/^\.\//, '');
  if (/^3Dmodels\//i.test(rel) || /^\/3Dmodels\//i.test(rel)) {
    const seg = rel.startsWith('/') ? rel : `/${rel}`;
    return { type: 'url', url: abs(seg) };
  }

  if (/\.(glb|gltf)$/i.test(t) && !t.includes('/') && !t.includes('\\')) {
    return { type: 'url', url: abs(`/3Dmodels/${t}`) };
  }

  return { type: 'url', url: t };
}
