import { Dimensions2D } from "../../types/geometry";

const defaultDimensions2D: Dimensions2D = { x: 100, y: 100 };
const dimensions2DRegex = /^(\d+)(?:x|\/)(\d+)$/;

export function parseDimensions2D(dimensionString: string): Dimensions2D {
  const match = dimensionString.match(dimensions2DRegex);

  if (match) {
    return {
      x: parseInt(match[1]),
      y: parseInt(match[2])
    };
  }
  return defaultDimensions2D;
}
