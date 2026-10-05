import { Dimensions2D } from "@/types/geometry";
import { Favorite } from "@/types/favorite";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { isRecord } from "@/core/utils/guards/guards";

const STORAGE_KEY = "skeletonThumbSizes";
const RECORDED_COUNT = 50;

export interface FavoritesThumbSizeRecorderConfiguration {
  ownerId: string;
}

export class FavoritesThumbSizeRecorder {
  private readonly ownerId: string;
  private readonly localKeyedValues: LocalKeyedValues;

  constructor({ ownerId }: FavoritesThumbSizeRecorderConfiguration, localKeyedValues: LocalKeyedValues) {
    this.ownerId = ownerId;
    this.localKeyedValues = localKeyedValues;
  }

  // Records the post sizes of the first favorites, in order, for the next visit.
  public record(favorites: Favorite[]): void {
    const sizes = favorites
      .slice(0, RECORDED_COUNT)
      .map(favorite => ({ width: favorite.getMetric("width"), height: favorite.getMetric("height") }))
      .filter(size => size.width > 0 && size.height > 0);

    this.localKeyedValues.set(STORAGE_KEY, { ownerId: this.ownerId, sizes });
  }

  public getRecorded(): Dimensions2D[] {
    const stored = this.localKeyedValues.get(STORAGE_KEY);

    if (!isRecord(stored) || stored.ownerId !== this.ownerId || !Array.isArray(stored.sizes)) {
      return [];
    }
    return stored.sizes.filter(isSize);
  }
}

function isSize(value: unknown): value is Dimensions2D {
  return isRecord(value) && typeof value.width === "number" && typeof value.height === "number";
}
