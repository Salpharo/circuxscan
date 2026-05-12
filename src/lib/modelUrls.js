/**
 * Default GLB when the app opens at `/` with no query string (e.g. QR → https://circuxscan.vercel.app/).
 * Use `?menu=1` or `?home=1` to open the full scanner / tabs UI instead.
 */
export const DEFAULT_ROOT_QR_MODEL_URL =
  "https://raw.githubusercontent.com/Salpharo/circuxscan/main/3Dmodels/Meshy_AI_Blue_robed_Sage_with__0512123340_texture.glb";

/**
 * Turn github.com HTML file links into direct raw.githubusercontent.com asset URLs
 * so GLTFLoader can fetch the binary (blob page is HTML, not the GLB).
 *
 * Supports:
 * - https://github.com/{owner}/{repo}/blob/{ref}/path/to/model.glb
 * - https://github.com/{owner}/{repo}/raw/{ref}/path/to/model.glb
 *
 * Leaves https://raw.githubusercontent.com/... unchanged.
 * @param {string} href
 * @returns {string}
 */
export function normalizeModelLoadUrl(href) {
  if (!href || typeof href !== 'string') return href;
  const trimmed = href.trim();
  if (!trimmed) return trimmed;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    if (host !== 'github.com') return trimmed;

    const parts = u.pathname.split('/').filter(Boolean);
    const blobI = parts.indexOf('blob');
    const rawI = parts.indexOf('raw');

    if (blobI !== -1 && parts.length > blobI + 3) {
      const owner = parts[0];
      const repo = parts[1];
      const ref = parts[blobI + 1];
      const rest = parts.slice(blobI + 2).join('/');
      return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${rest}${u.search}${u.hash}`;
    }

    if (rawI !== -1 && parts.length > rawI + 3) {
      const owner = parts[0];
      const repo = parts[1];
      const ref = parts[rawI + 1];
      const rest = parts.slice(rawI + 2).join('/');
      return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${rest}${u.search}${u.hash}`;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Resolve QR / manual input into a hosted GLB URL or an in-app library id.
 * Supports full URLs, ./3Dmodels/... , /3Dmodels/... , and /3dmodellibrary/:id links.
 * GitHub blob/raw web URLs are normalized to raw.githubusercontent.com.
 * @param {string} raw
 * @returns {{ type: 'url', url: string } | { type: 'library', modelId: string } | null}
 */
export function resolveScanPayload(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let t = raw.trim();
  if (!t) return null;

  if (/^https?:\/\//i.test(t)) {
    t = normalizeModelLoadUrl(t);
  }

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
    return { type: 'url', url: normalizeModelLoadUrl(asUrl.href) };
  }

  if (/^https?:\/\//i.test(t)) {
    return { type: 'url', url: normalizeModelLoadUrl(t) };
  }

  const rel = t.replace(/^\.\//, '');
  if (/^3Dmodels\//i.test(rel) || /^\/3Dmodels\//i.test(rel)) {
    const seg = rel.startsWith('/') ? rel : `/${rel}`;
    return { type: 'url', url: normalizeModelLoadUrl(abs(seg)) };
  }

  if (/\.(glb|gltf)$/i.test(t) && !t.includes('/') && !t.includes('\\')) {
    return { type: 'url', url: normalizeModelLoadUrl(abs(`/3Dmodels/${t}`)) };
  }

  return { type: 'url', url: normalizeModelLoadUrl(t) };
}
