import { ContentType } from "../../types/primitives/primitives";
import { Dimensions2D } from "../../types/primitives/composites";
const DEFAULT_DIMENSIONS_2D: Dimensions2D = {width: 100, height: 100};
const DIMENSIONS_2D_REGEX = /^(\d+)x(\d+)$/;
const OR_GROUP_REGEX = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;

export function toCamelCase(variable: string): string {
  return variable.replace(/_([a-z])/g, (_, character) => character.toUpperCase());
}

export function removeExtraWhiteSpace(text: string): string {
  return text.trim().replace(/\s\s+/g, " ");
}

export function getDimensions2D(dimensionString: string): Dimensions2D {
  const match = dimensionString.match(DIMENSIONS_2D_REGEX);

  if (match) {
    return {
      width: parseInt(match[1]),
      height: parseInt(match[2])
    };
  }
  return DEFAULT_DIMENSIONS_2D;
}

export function isEmptyString(text: string): boolean {
  return text.trim().length === 0;
}

export function escapeParenthesis(text: string): string {
  return text.replace(/([()])/g, "\\$&");
}

function prepareSearchQuery(searchQuery: string): string {
  return removeExtraWhiteSpace(searchQuery).toLowerCase();
}

function extractOrGroups(searchQuery: string): string[][] {
  return Array.from(searchQuery.matchAll(OR_GROUP_REGEX)).map((orGroup) => orGroup[1].split(" ~ "));
}

function extractRemainingTags(searchQuery: string): string[] {
  return removeExtraWhiteSpace(searchQuery.replace(OR_GROUP_REGEX, "")).split(" ").filter((tag) => tag !== "");
}

export function extractTagGroups(searchQuery: string): { orGroups: string[][], remainingTags: string[] } {
  searchQuery = prepareSearchQuery(searchQuery);
  return {
    orGroups: extractOrGroups(searchQuery),
    remainingTags: extractRemainingTags(searchQuery)
  };
}

export function getContentType(tags: string | Set<string>): ContentType {
  if (typeof tags === "string") {
    tags = convertToTagSet(tags);
  }

  if (tags.has("video") || tags.has("mp4")) {
    return "video";
  }

  if ((tags.has("gif") || tags.has("animated"))) {
    return "gif";
  }
  return "image";
}

export function removeNonNumericCharacters(text: string): string {
  return text.replace(/\D/g, "");
}

export function negateTags(tags: string): string {
  return tags.replace(/(\S+)/g, "-$1");
}

export function isOnlyDigits(text: string): boolean {
  return (/^\d+$/).test(text);
}

export function convertToTagSet(tagString: string): Set<string> {
  tagString = removeExtraWhiteSpace(tagString);

  if (tagString === "") {
    return new Set();
  }
  return new Set(tagString.split(" ").sort());
}

export function convertToTagSetFast(tagString: string): Set<string> {
  if (tagString === "") {
    return new Set();
  }
  return new Set(tagString.split(" "));
}

export function convertToTagString(tagSet: Set<string>): string {
  if (tagSet.size === 0) {
    return "";
  }
  return Array.from(tagSet).sort().join(" ");
}

export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function removeFirstAndLastLines(text: string): string {
  const lines = text.split("\n").filter(line => line.trim() !== "");

  if (lines.length <= 2) {
    return "";
  }
  return lines.slice(1, -1).join("\n").trim();
}

export function removeLeadingHyphens(tag: string): string {
  return tag.replace(/^[-*]*/, "");
}

export function replaceSpacesWithUnderscores(tagName: string): string {
  return tagName.replaceAll(/\s/gm, "_");
}
