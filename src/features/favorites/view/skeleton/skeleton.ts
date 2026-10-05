import { randomBoolean, randomIntInRange } from "@/core/utils/number/number";
import { Dimensions2D } from "@/types/geometry";
import { FavoritesSkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";
import { Layout } from "@/types/app";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";

const RANDOM_ITEM_COUNT = 50;
const THUMB_BOX = { longSide: 250, minShortSide: 125 };

export class FavoritesSkeleton {
  private readonly randomSource: RandomSource;

  constructor(randomSource: RandomSource) {
    this.randomSource = randomSource;
  }

  // One placeholder per recorded size, or random sizes when none were recorded.
  public createElements(layout: Layout, recordedSizes: Dimensions2D[]): HTMLElement[] {
    const sizes = recordedSizes.length > 0 ? recordedSizes.map(fitToThumbBox) : this.randomThumbSizes();
    return sizes.map(size => new FavoritesSkeletonItem({ layout, size }).element);
  }

  private randomThumbSizes(): Dimensions2D[] {
    return Array.from({ length: RANDOM_ITEM_COUNT }, () => this.randomThumbSize());
  }

  private randomThumbSize(): Dimensions2D {
    const { longSide, minShortSide } = THUMB_BOX;
    const shortSide = randomIntInRange(this.randomSource, minShortSide, longSide);
    return randomBoolean(this.randomSource) ? { width: longSide, height: shortSide } : { width: shortSide, height: longSide };
  }
}

function fitToThumbBox({ width, height }: Dimensions2D): Dimensions2D {
  const scale = THUMB_BOX.longSide / Math.max(width, height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
