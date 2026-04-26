export function toCamelCase(variable: string): string {
  return variable.replace(/_([a-z])/g, (_, character) => character.toUpperCase());
}

export function removeExtraWhiteSpace(text: string): string {
  return text.trim().replace(/\s\s+/g, " ");
}

export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function removeLeadingHyphens(tag: string): string {
  return tag.replace(/^[-*]*/, "");
}

export function replaceSpacesWithUnderscores(tagName: string): string {
  return tagName.replaceAll(/\s/gm, "_");
}

export function removeFirstAndLastLines(text: string): string {
  const lines = text.split("\n").filter(line => line.trim() !== "");

  if (lines.length <= 2) {
    return "";
  }
  return lines.slice(1, -1).join("\n").trim();
}

export function escapeParenthesis(text: string): string {
  return text.replace(/([()])/g, "\\$&");
}

export function negateTags(tags: string): string {
  return tags.replace(/(\S+)/g, "-$1");
}
