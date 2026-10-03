export function decodeHtmlEntities(text: string): string {
  return text.replace(/&amp;/g, "&").replace(/&(?:apos|#0?39);/g, "'");
}
