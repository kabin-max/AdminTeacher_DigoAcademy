import { cn } from '@/shared/utils/cn';

/**
 * Renders stored TipTap HTML for course descriptions. Prefer this over a raw
 * textarea dump so lists/headings/links keep their structure.
 *
 * Content is authored by authenticated instructors/admins; still keep markup
 * limited to what TipTap emits (no scripts).
 */
export function RichTextContent({
  html,
  className,
}: {
  html: string | null | undefined;
  className?: string;
}) {
  if (!html?.trim()) return null;

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none text-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
