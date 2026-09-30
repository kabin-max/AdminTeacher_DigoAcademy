/**
 * Flattens a Zod error's `fieldErrors` (each field → string[]) down to the
 * first message per field, for rendering one inline error under each input.
 */
export function firstFieldErrors<T extends string>(
  fieldErrors: Partial<Record<T, string[] | undefined>>
): Partial<Record<T, string>> {
  const result: Partial<Record<T, string>> = {};
  for (const key of Object.keys(fieldErrors) as T[]) {
    const message = fieldErrors[key]?.[0];
    if (message) result[key] = message;
  }
  return result;
}
