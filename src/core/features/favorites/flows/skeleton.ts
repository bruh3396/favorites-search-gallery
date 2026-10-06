import { Dimensions } from "@/core/ui/post_grid/tile";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesDependencies } from "@/core/features/favorites/types/favorites";

export type FavoritesSkeletonFlowDependencies = Pick<FavoritesDependencies, "skeletonDimensions">;

export class FavoritesSkeletonFlow {
  public readonly recordedDimensions: readonly Dimensions[];

  constructor(private readonly dependencies: FavoritesSkeletonFlowDependencies) {
    this.recordedDimensions = dependencies.skeletonDimensions.peek();
  }

  public record(favorites: readonly Favorite[]): void {
    this.dependencies.skeletonDimensions.set(measureDimensions(favorites));
  }
}

function measureDimensions(favorites: readonly Favorite[]): Dimensions[] {
  return favorites
    .map(favorite => ({ width: favorite.getMetric("width"), height: favorite.getMetric("height") }))
    .filter(({ width, height }) => width > 0 && height > 0);
}
