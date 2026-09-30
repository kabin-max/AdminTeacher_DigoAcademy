/**
 * Helper to convert YouTube URLs (watch, share link, shorts, embed) into clean, privacy-enhanced iframe embed URLs.
 */
export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const str = url.trim();
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match && match[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}
