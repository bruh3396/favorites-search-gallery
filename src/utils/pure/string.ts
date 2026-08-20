export function isOnlyDigits(text: string): boolean {
  return (/^\d+$/).test(text);
}

export function isEmptyString(text: string): boolean {
  return text.trim().length === 0;
}

export function snakeToCamelCase(text: string): string {
  return text.replace(/_([a-z])/g, (_, character) => character.toUpperCase());
}

export function camelToKebabCase(text: string): string {
  return text.replace(/([A-Z])/g, (_, character) => `-${character.toLowerCase()}`);
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function removeExtraWhitespace(text: string): string {
  return text.trim().replace(/\s\s+/g, " ");
}

export function removeLeadingModifiers(text: string): string {
  return text.replace(/^[-*]*/, "");
}

export function removeNonNumericCharacters(text: string): string {
  return text.replace(/\D/g, "");
}

export function replaceSpacesWithUnderscores(text: string): string {
  return text.replaceAll(/\s/gm, "_");
}

export function escapeParentheses(text: string): string {
  return text.replace(/([()])/g, "\\$&");
}

export function decodeHtmlEntities(text: string): string {
  return text.replace(/&amp;/g, "&").replace(/&(?:apos|#0?39);/g, "'");
}

export function pluralSuffix(count: number): string {
  return count === 1 ? "" : "s";
}
