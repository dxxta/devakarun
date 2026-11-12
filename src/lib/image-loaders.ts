type LoaderArgs = { src: string; width: number; quality?: number }

const DEFAULT_QUALITY = 75

// Cloudflare Images transformations (free plan: 5,000 unique transformations a month).
// Needs a proxied zone with Transformations enabled; no API token is involved.
export function cloudflareLoader({ src, width, quality }: LoaderArgs): string {
  if (!src.startsWith('/')) return src
  return `/cdn-cgi/image/width=${width},quality=${quality ?? DEFAULT_QUALITY},format=auto${src}`
}
