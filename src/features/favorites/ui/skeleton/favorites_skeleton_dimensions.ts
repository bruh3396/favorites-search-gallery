import { getRandomPositiveIntegerInRange, getSeededRandomPositiveIntegerInRange } from "../../../../utils/number";
import { Dimensions2D } from "../../../../types/common_types";
import { parseDimensions2D } from "../../../../utils/string/parse";
import { getNextAspectRatio } from "./favorites_skeleton_aspect_ratio_collector";

export function getPredictedAspectRatio(): string {
  return getNextAspectRatio() ?? `10/${getSeededRandomPositiveIntegerInRange(5, 20)}`;
}

export function getPredictedDiscreteDimensions(): Dimensions2D {
  const aspectRatio = getNextAspectRatio();

  if (aspectRatio !== undefined) {
    return parseDimensions2D(aspectRatio);
  }
  const maximizeWidth = Math.random() < 0.5;
  const randomDimension = getRandomPositiveIntegerInRange(125, 250);
  return { x: maximizeWidth ? 250 : randomDimension, y: maximizeWidth ? randomDimension : 250 };
}
