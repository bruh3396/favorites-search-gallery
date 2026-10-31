export function isOnlyDigits(text: string): boolean {
  return (/^\d+$/).test(text);
}

export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
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

export function toLowerUnderscored(text: string): string {
  return removeExtraWhitespace(text).toLowerCase().replace(/\s/g, "_");
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

export function getPluralSuffix(count: number): string {
  return count === 1 ? "" : "s";
}

export function computeTrigrams(value: string): string[] {
  const trigrams: string[] = [];

  for (let i = 0; i + 3 <= value.length; i += 1) {
    trigrams.push(value.slice(i, i + 3));
  }
  return trigrams;
}

export function copyString(value: string): string {
  return [...value].join("");
}

export function listPrefixes(word: string): string[] {
  const prefixes: string[] = [];

  for (let i = 1; i <= word.length; i += 1) {
    prefixes.push(word.slice(0, i));
  }
  return prefixes;
}

export function listSubstrings(word: string): string[] {
  const substrings: string[] = [];

  for (let start = 0; start < word.length; start += 1) {
    for (let end = start + 1; end <= word.length; end += 1) {
      substrings.push(word.slice(start, end));
    }
  }
  return substrings;
}
