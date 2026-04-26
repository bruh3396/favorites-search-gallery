import { ContentType, Dimensions2D } from "../../types/common_types";
import { removeExtraWhiteSpace } from "./format";
import { convertToTagSet } from "./tags";

const DEFAULT_DIMENSIONS_2D: Dimensions2D = { width: 100, height: 100 };
const DIMENSIONS_2D_REGEX = /^(\d+)(?:x|\/)(\d+)$/;
const OR_GROUP_REGEX = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;

export function isOnlyDigits(text: string): boolean {
  return (/^\d+$/).test(text);
}

export function prepareSearchQuery(searchQuery: string): string {
  return removeExtraWhiteSpace(searchQuery).toLowerCase();
}

export function extractOrGroups(searchQuery: string): string[][] {
  return Array.from(searchQuery.matchAll(OR_GROUP_REGEX)).map((orGroup) => orGroup[1].split(" ~ "));
}

export function extractAndTags(searchQuery: string): string[] {
  return removeExtraWhiteSpace(searchQuery.replace(OR_GROUP_REGEX, "")).split(" ").filter((tag) => tag !== "");
}

export function extractTagGroups(searchQuery: string): { orGroups: string[][]; andTags: string[]; } {
  searchQuery = prepareSearchQuery(searchQuery);
  return {
    orGroups: extractOrGroups(searchQuery),
    andTags: extractAndTags(searchQuery)
  };
}

export function removeNonNumericCharacters(text: string): string {
  return text.replace(/\D/g, "");
}

export function isEmptyString(text: string): boolean {
  return text.trim().length === 0;
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

