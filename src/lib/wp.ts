import { Buffer } from 'node:buffer';
import { getEnvValue } from './env';

type ProductCard = {
  id: number;
  title: string;
  slug: string;
  link: string;
  image?: string | null;
  priceText?: string | null;
  dimensions?: string | null;
  medium?: string | null;
  description?: string | null;
};

const baseUrl =
  (getEnvValue(['WP_API_BASE', 'PUBLIC_WP_API_BASE']) ?? '').replace(/\/$/, '') || '';
const username = getEnvValue(['WP_USERNAME']);
const appPassword = getEnvValue(['WP_APP_PASSWORD']);

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const cacheTtlMs = (() => {
  const rawTtl = getEnvValue(['WP_CACHE_TTL_MS', 'WP_CACHE_TTL']);
  if (!rawTtl) return DEFAULT_CACHE_TTL_MS;
  const parsed = Number(rawTtl);
  if (!Number.isFinite(parsed)) return DEFAULT_CACHE_TTL_MS;
  return Math.max(0, parsed);
})();

const authHeader =
  username && appPassword
    ? `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`
    : '';

type CacheEntry = { items: ProductCard[]; limit: number; expiresAt: number };
let productsCache: CacheEntry | null = null;

const buildUrl = (path: string) => {
  if (!baseUrl) {
    throw new Error('Missing WP_API_BASE');
  }
  return path.startsWith('http') ? path : `${baseUrl}${path}`;
};

const fetchFromWP = async (path: string, init?: RequestInit) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  return fetch(buildUrl(path), { ...init, headers });
};

const stripTags = (value?: string | null) =>
  (value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const normalizeMediumText = (value: string) =>
  value.replace(/\bolio\b/gi, match => {
    if (match === match.toUpperCase()) return 'ÓLEO';
    if (match[0] === match[0].toUpperCase()) return 'Óleo';
    return 'óleo';
  });

const normalizeImage = (src?: string | null) => {
  if (!src) return null;
  const httpsSrc = src.replace('http://', 'https://');
  // Prefer full-size WordPress media instead of small thumbnails (e.g., -300x300.jpg).
  return httpsSrc.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp))/i, '');
};

const formatPrice = (price?: string | null, regular?: string | null) => {
  const numeric = price && !Number.isNaN(Number(price)) ? Number(price) : null;
  const regularNumeric =
    regular && !Number.isNaN(Number(regular)) ? Number(regular) : null;

  if (numeric !== null) {
    return `$${numeric.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} USD`;
  }
  if (regularNumeric !== null) {
    return `$${regularNumeric.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} USD`;
  }
  return null;
};

const deriveDimensions = (
  name: string,
  dimensions?: { width?: string; height?: string; length?: string }
) => {
  if (dimensions?.width && dimensions?.height) {
    return `${dimensions.width} x ${dimensions.height}`;
  }

  const match = name.match(/(\d{2,3})\s*[xX]\s*(\d{2,3})/);
  if (match) {
    return `${match[1]} x ${match[2]}`;
  }

  return null;
};

const getDimensionsFromAttributes = (attributes: Array<Record<string, any>>) => {
  for (const attr of attributes ?? []) {
    const name = stripTags(attr?.name).trim();
    if (name) return name;
  }
  return null;
};

const getMediumFromAttributes = (attributes: Array<Record<string, any>>) => {
  for (const attr of attributes ?? []) {
    const options = Array.isArray(attr?.options) ? attr.options : [];
    for (const option of options) {
      const cleaned = stripTags(typeof option === 'string' ? option : String(option)).trim();
      if (cleaned) {
        return normalizeMediumText(cleaned);
      }
    }
  }
  return null;
};

const extractFirstImageSrc = (html?: string | null) => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src\s*=\s*['"]([^'">]+)['"]/i);
  return normalizeImage(match?.[1]);
};

const mapProduct = (item: Record<string, any>): ProductCard | null => {
  const rawTitle = normalizeMediumText(stripTags(item.name));
  if (!rawTitle) return null;
  const attributes = Array.isArray(item.attributes) ? item.attributes : [];
  const dimensions =
    getDimensionsFromAttributes(attributes) || deriveDimensions(rawTitle, item.dimensions);
  const medium = getMediumFromAttributes(attributes);
  const title = rawTitle;
  const priceText = formatPrice(item.price, item.regular_price);
  const image =
    normalizeImage(item.images?.[0]?.src) ||
    extractFirstImageSrc(item.description);
  const descriptionRaw = stripTags(item.description);
  const description = descriptionRaw ? normalizeMediumText(descriptionRaw) : null;
  return {
    id: item.id,
    title,
    slug: item.slug,
    link: item.permalink,
    image,
    priceText,
    dimensions,
    medium,
    description,
  };
};

const getCachedProducts = (limit: number) => {
  if (!productsCache) return null;
  const { expiresAt, items, limit: cachedLimit } = productsCache;
  if (cachedLimit < limit) return null;

  const isFresh = cacheTtlMs > 0 && expiresAt > Date.now();
  return isFresh ? items.slice(0, limit) : null;
};

const getStaleProducts = (limit: number) => {
  if (!productsCache) return null;
  if (productsCache.limit < limit) return null;
  return productsCache.items.slice(0, limit);
};

const setCache = (items: ProductCard[], limit: number) => {
  productsCache = {
    items,
    limit,
    expiresAt: Date.now() + cacheTtlMs,
  };
};

export const getProducts = async (limit = 100): Promise<ProductCard[]> => {
  if (!baseUrl) return [];

  const cached = getCachedProducts(limit);
  if (cached) return cached;

  const stale = getStaleProducts(limit);
  const url = new URL(`${baseUrl}/wc/v3/products`);
  url.searchParams.set('per_page', String(limit));
  url.searchParams.set('order', 'desc');
  url.searchParams.set('orderby', 'date');
  url.searchParams.set(
    '_fields',
    'id,name,slug,permalink,images,price,regular_price,dimensions,description,attributes'
  );

  try {
    const res = await fetchFromWP(url.toString());
    if (!res.ok) {
      console.warn('WP products fetch failed', res.status, res.statusText);
      return stale ?? [];
    }
    const items = (await res.json()) as Array<Record<string, any>>;
    const products = items
      .map(mapProduct)
      .filter((item): item is ProductCard => Boolean(item?.image));

    setCache(products, limit);
    return products;
  } catch (error) {
    console.warn('WP products fetch error', error);
    return stale ?? [];
  }
};

export const getProductBySlug = async (slug: string): Promise<ProductCard | null> => {
  if (!baseUrl) return null;
  const url = new URL(`${baseUrl}/wc/v3/products`);
  url.searchParams.set('slug', slug);
  url.searchParams.set('per_page', '1');
  url.searchParams.set(
    '_fields',
    'id,name,slug,permalink,images,price,regular_price,dimensions,description,attributes'
  );

  try {
    const res = await fetchFromWP(url.toString());
    if (!res.ok) {
      console.warn('WP product slug fetch failed', res.status, res.statusText);
      return null;
    }
    const items = (await res.json()) as Array<Record<string, any>>;
    const item = items[0];
    const mapped = item ? mapProduct(item) : null;
    return mapped && mapped.image ? mapped : null;
  } catch (error) {
    console.warn('WP product slug fetch error', error);
    return null;
  }
};
