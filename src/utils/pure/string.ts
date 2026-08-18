import { Dimensions2D } from "@/types/geometry";

export function isOnlyDigits(text: string): boolean {
  return (/^\d+$/).test(text);
}

export function isEmptyString(text: string): boolean {
  return text.trim().length === 0;
}

export function toCamelCase(variable: string): string {
  return variable.replace(/_([a-z])/g, (_, character) => character.toUpperCase());
}

export function toKebabCase(variable: string): string {
  return variable.replace(/([A-Z])/g, (_, character) => `-${character.toLowerCase()}`);
}

export function removeExtraWhiteSpace(text: string): string {
  return text.trim().replace(/\s\s+/g, " ");
}

export function removeLeadingHyphens(tag: string): string {
  return tag.replace(/^[-*]*/, "");
}

export function removeNonNumericCharacters(text: string): string {
  return text.replace(/\D/g, "");
}

export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function pluralize(count: number): string {
  return count === 1 ? "" : "s";
}

export function replaceSpacesWithUnderscores(tagName: string): string {
  return tagName.replaceAll(/\s/gm, "_");
}

export function escapeParenthesis(text: string): string {
  return text.replace(/([()])/g, "\\$&");
}

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&(?:apos|#0?39);/g, "'");
}

export function parseDimensions2D(dimensionString: string): Dimensions2D {
  const match = dimensionString.match(/^(\d+)(?:x|\/)(\d+)$/);
  return match ? { x: parseInt(match[1], 10), y: parseInt(match[2], 10)} : { x: 100, y: 100 };
}
