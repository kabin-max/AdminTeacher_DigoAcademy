/**
 * Slugify a category name — lowercase, alphanumerics separated by single
 * hyphens. Framework-free so it is usable on client and server.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
