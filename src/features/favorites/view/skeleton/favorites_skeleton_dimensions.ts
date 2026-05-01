import { randomIntInRange, seededRandomIntInRange } from "../../../../utils/number";
import { Dimensions2D } from "../../../../types/geometry";
import { getNextAspectRatio } from "./favorites_aspect_ratio_collector";
import { parseDimensions2D } from "../../../../utils/string/parse";

export function getPredictedAspectRatio(): string {
  return getNextAspectRatio() ?? `10/${seededRandomIntInRange(5, 20)}`;
}

export function getPredictedDiscreteDimensions(): Dimensions2D {
  const aspectRatio = getNextAspectRatio();

  if (aspectRatio !== undefined) {
    return parseDimensions2D(aspectRatio);
  }
  const maximizeWidth = Math.random() < 0.5;
  const randomDimension = randomIntInRange(125, 250);
  return { x: maximizeWidth ? 250 : randomDimension, y: maximizeWidth ? randomDimension : 250 };
}
