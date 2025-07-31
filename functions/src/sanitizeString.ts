export function sanitizeString(inputString: string): string {
  return inputString
    .replace(/[^\w\s\p{P}]/gu, '')
    .replace(/['']/g, '')
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
