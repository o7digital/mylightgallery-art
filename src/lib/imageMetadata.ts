import { inferRemoteSize } from 'astro/assets/utils';
import dimensions from './imageDimensions.json';

type Dimensions = { width: number; height: number };
const remoteCache = new Map<string, { expires: number; value: Promise<Dimensions | null> }>();

export async function getImageDimensions(src: string): Promise<Dimensions | null> {
  if (src.startsWith('/')) {
    return (dimensions as Record<string, Dimensions>)[decodeURIComponent(src)] ?? null;
  }
  const url = new URL(src);
  if (url.protocol !== 'https:' || url.hostname !== 'wp-mylightartgallery.o7digitalgroup.com' || !url.pathname.startsWith('/wp-content/')) return null;
  const cached = remoteCache.get(src);
  if (cached && cached.expires > Date.now()) return cached.value;
  const value = inferRemoteSize(src).then(({ width, height }) => ({ width, height })).catch(() => {
    remoteCache.delete(src);
    return null;
  });
  if (remoteCache.size >= 500) remoteCache.delete(remoteCache.keys().next().value!);
  remoteCache.set(src, { expires: Date.now() + 86400000, value });
  return value;
}
