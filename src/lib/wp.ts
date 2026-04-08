import { Buffer } from 'node:buffer';
import { getEnvValue } from './env';

type ProductCard = {
  id: number;
  title: string;
  slug: string;
  link: string;
  image?: string | null;
  imageFull?: string | null;
  imageSrcSet?: string | null;
  imageSizes?: string | null;
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
  value
    .replace(/\bolio\b/gi, match => {
      if (match === match.toUpperCase()) return 'ÓLEO';
      if (match[0] === match[0].toUpperCase()) return 'Óleo';
      return 'óleo';
    })
    .replace(/\bacrilico\b/gi, match => {
      if (match === match.toUpperCase()) return 'ACRÍLICO';
      if (match[0] === match[0].toUpperCase()) return 'Acrílico';
      return 'acrílico';
    });

const normalizeDimensionsText = (value: string) =>
  value
    .replace(/(\d{2,3})\s*[x×]\s*(\d{2,3})/gi, '$1 x $2')
    .replace(/\s+/g, ' ')
    .trim();

const cleanProductTitle = (value: string) => {
  const normalized = normalizeDimensionsText(value);
  const trimmed = normalized
    .replace(
      /\s*\b\d{2,3}\s*x\s*\d{2,3}\b\s*(?:acrilic[oa]?|acrílic[oa]?|oleo|óleo|oil)?\s*$/i,
      ''
    )
    .replace(/\s*\b(?:acrilic[oa]?|acrílic[oa]?|oleo|óleo|oil)\b\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return trimmed || normalized;
};

const extractDimensionsFromText = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.replace(/-/g, ' ');
  const match = normalized.match(/(\d{2,3})\s*[x×]\s*(\d{2,3})/i);
  if (!match) return null;
  return `${match[1]} x ${match[2]}`;
};

const extractMediumFromText = (value?: string | null) => {
  if (!value) return null;
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (/\bacrilic(?:o)?\b/.test(normalized)) return 'Acrílico';
  if (/\boleo\b|\boil\b/.test(normalized)) return 'Óleo';
  return null;
};

const normalizeImage = (src?: string | null) => {
  if (!src) return null;
  return src.replace('http://', 'https://');
};

const normalizeFullImage = (src?: string | null) => {
  const normalized = normalizeImage(src);
  if (!normalized) return null;
  return normalized.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp))/i, '');
};

const normalizeSrcSet = (srcset?: string | null) => {
  if (!srcset) return null;
  return srcset
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const match = part.match(/^(\S+)\s+(.+)$/);
      if (!match) return normalizeImage(part) ?? part;
      const url = normalizeImage(match[1]) ?? match[1];
      return `${url} ${match[2]}`;
    })
    .join(', ');
};

const pickListImageFromSrcSet = (srcset?: string | null, targetWidth = 768) => {
  if (!srcset) return null;
  const candidates = srcset
    .split(',')
    .map(part => part.trim())
    .map(part => {
      const match = part.match(/^(\S+)\s+(\d+)w$/);
      if (!match) return null;
      const url = normalizeImage(match[1]);
      const width = Number(match[2]);
      if (!url || !Number.isFinite(width)) return null;
      return { url, width };
    })
    .filter((item): item is { url: string; width: number } => Boolean(item));

  if (candidates.length === 0) return null;
  const sorted = candidates.sort((a, b) => a.width - b.width);
  const notTooLarge = sorted.filter(item => item.width <= targetWidth);
  if (notTooLarge.length > 0) return notTooLarge[notTooLarge.length - 1].url;
  return sorted[0].url;
};

const formatPrice = (price?: string | null, regular?: string | null) => {
  const numeric = price && !Number.isNaN(Number(price)) ? Number(price) : null;
  const regularNumeric =
    regular && !Number.isNaN(Number(regular)) ? Number(regular) : null;

  if (numeric !== null && numeric > 0) {
    return `$${numeric.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} USD`;
  }
  if (regularNumeric !== null && regularNumeric > 0) {
    return `$${regularNumeric.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} USD`;
  }
  return null;
};

const deriveDimensions = (
  name: string,
  dimensions?: { width?: string; height?: string; length?: string },
  slug?: string,
  permalink?: string
) => {
  if (dimensions?.width && dimensions?.height) {
    return normalizeDimensionsText(`${dimensions.width} x ${dimensions.height}`);
  }

  const fromName = extractDimensionsFromText(name);
  if (fromName) return fromName;

  const fromSlug = extractDimensionsFromText(slug);
  if (fromSlug) return fromSlug;

  const fromPermalink = extractDimensionsFromText(permalink);
  if (fromPermalink) return fromPermalink;

  return null;
};

const deriveMedium = (
  attributes: Array<Record<string, any>>,
  name?: string,
  slug?: string,
  permalink?: string,
  description?: string
) => {
  const fromAttributes = getMediumFromAttributes(attributes);
  if (fromAttributes) return fromAttributes;

  const fromName = extractMediumFromText(name);
  if (fromName) return fromName;

  const fromSlug = extractMediumFromText(slug);
  if (fromSlug) return fromSlug;

  const fromPermalink = extractMediumFromText(permalink);
  if (fromPermalink) return fromPermalink;

  const fromDescription = extractMediumFromText(description);
  if (fromDescription) return fromDescription;

  return null;
};

const deriveDimensionsFromAttributes = (attributes: Array<Record<string, any>>) => {
  const fromAttributes = getDimensionsFromAttributes(attributes);
  if (!fromAttributes) return null;
  const extracted = extractDimensionsFromText(fromAttributes);
  if (extracted) return extracted;
  const normalized = normalizeDimensionsText(fromAttributes);
  return normalized || null;
};

const mapProduct = (item: Record<string, any>): ProductCard | null => {
  const rawTitle = normalizeMediumText(stripTags(item.name));
  if (!rawTitle) return null;
  const title = cleanProductTitle(rawTitle);
  const attributes = Array.isArray(item.attributes) ? item.attributes : [];
  const dimensions =
    deriveDimensionsFromAttributes(attributes) ||
    deriveDimensions(rawTitle, item.dimensions, item.slug, item.permalink);
  const medium = deriveMedium(
    attributes,
    rawTitle,
    item.slug,
    item.permalink,
    typeof item.description === 'string' ? item.description : null
  );
  const priceText = formatPrice(item.price, item.regular_price);
  const mainImage = item.images?.[0] ?? null;
  const imageSrcSet = normalizeSrcSet(mainImage?.srcset);
  const imageSizes = typeof mainImage?.sizes === 'string' ? mainImage.sizes : null;
  const image =
    pickListImageFromSrcSet(mainImage?.srcset) ||
    normalizeImage(mainImage?.thumbnail) ||
    normalizeImage(mainImage?.src) ||
    extractFirstImageSrc(item.description);
  const imageFull =
    normalizeFullImage(mainImage?.src) ||
    normalizeFullImage(extractFirstImageSrc(item.description));
  const descriptionRaw = stripTags(item.description);
  const description = descriptionRaw ? normalizeMediumText(descriptionRaw) : null;
  return {
    id: item.id,
    title,
    slug: item.slug,
    link: item.permalink,
    image,
    imageFull,
    imageSrcSet,
    imageSizes,
    priceText,
    dimensions,
    medium,
    description,
  };
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
  const safeLimit = Math.min(Math.max(Math.floor(limit || 0), 1), 100);

  const cached = getCachedProducts(safeLimit);
  if (cached) return cached;

  const stale = getStaleProducts(safeLimit);
  const url = new URL(`${baseUrl}/wc/v3/products`);
  url.searchParams.set('per_page', String(safeLimit));
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

    setCache(products, safeLimit);
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
