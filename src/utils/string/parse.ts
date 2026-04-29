import { Dimensions2D } from "../../types/geometry";

const DEFAULT_DIMENSIONS_2D: Dimensions2D = { x: 100, y: 100 };
const DIMENSIONS_2D_REGEX = /^(\d+)(?:x|\/)(\d+)$/;

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
