// Page data is split into 256 small JSON files ("buckets") so a page can be looked up with one tiny request and the
// whole site stays well under Cloudflare Pages' 20,000-files-per-deployment limit.
// scripts/build-data.mjs imports this same function, so the writer and every reader always agree.

/** 32-bit FNV-1a hash of `slug`, reduced to two hex digits ("00"–"ff"). */
export function bucketOf(slug: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) & 0xff).toString(16).padStart(2, '0');
}
