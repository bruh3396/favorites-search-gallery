import { prepareSearchQuery, removeExtraWhiteSpace } from "./format";
import { Dimensions2D } from "../../types/geometry";

const DEFAULT_DIMENSIONS_2D: Dimensions2D = { x: 100, y: 100 };
const DIMENSIONS_2D_REGEX = /^(\d+)(?:x|\/)(\d+)$/;
const OR_GROUP_REGEX = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;

function parseOrGroups(searchQuery: string): string[][] {
  return Array.from(searchQuery.matchAll(OR_GROUP_REGEX)).map((orGroup) => orGroup[1].split(" ~ "));
}

function parseAndTags(searchQuery: string): string[] {
  return removeExtraWhiteSpace(searchQuery.replace(OR_GROUP_REGEX, "")).split(" ").filter((tag) => tag !== "");
}

export function parseTagGroups(searchQuery: string): { orGroups: string[][]; andTags: string[]; } {
  searchQuery = prepareSearchQuery(searchQuery);
  return {
    orGroups: parseOrGroups(searchQuery),
    andTags: parseAndTags(searchQuery)
  };
}

export function parseDimensions2D(dimensionString: string): Dimensions2D {
  const match = dimensionString.match(DIMENSIONS_2D_REGEX);

  if (match) {
    return {
      x: parseInt(match[1]),
      y: parseInt(match[2])
    };
  }
  return DEFAULT_DIMENSIONS_2D;
}
