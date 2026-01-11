import { Buffer } from 'node:buffer';

type ProductCard = {
  id: number;
  title: string;
  slug: string;
  link: string;
  image?: string | null;
};

const baseUrl = (import.meta.env.WP_API_BASE as string | undefined)?.replace(/\/$/, '') || '';
const username = import.meta.env.WP_USERNAME as string | undefined;
const appPassword = import.meta.env.WP_APP_PASSWORD as string | undefined;

const authHeader =
  username && appPassword
    ? `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`
    : '';

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

const extractFirstImageSrc = (html?: string | null) => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src\s*=\s*['"]([^'">]+)['"]/i);
  if (!match?.[1]) return null;
  // Force https to éviter les warnings mixtes.
  return match[1].replace('http://', 'https://');
};

const stripTags = (value?: string | null) =>
  (value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export const getProducts = async (limit = 12): Promise<ProductCard[]> => {
  if (!baseUrl) return [];

  const url = new URL(`${baseUrl}/wp/v2/product`);
  url.searchParams.set('per_page', String(limit));
  url.searchParams.set('order', 'desc');
  url.searchParams.set('orderby', 'date');
  url.searchParams.set('_fields', 'id,slug,title,link,content');

  try {
    const res = await fetchFromWP(url.toString());
    if (!res.ok) {
      console.warn('WP products fetch failed', res.status, res.statusText);
      return [];
    }
    const items = (await res.json()) as Array<Record<string, unknown>>;
    return items.map(item => {
      const title = stripTags((item.title as { rendered?: string })?.rendered);
      const content = (item.content as { rendered?: string })?.rendered;
      return {
        id: item.id as number,
        title,
        slug: item.slug as string,
        link: item.link as string,
        image: extractFirstImageSrc(content),
      };
    });
  } catch (error) {
    console.warn('WP products fetch error', error);
    return [];
  }
};
