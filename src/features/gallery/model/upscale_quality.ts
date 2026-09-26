import { GalleryUpscaleQualityDependencies } from "@/features/gallery/types/types";

export class GalleryDynamicUpscaleQuality {
  constructor(private readonly dependencies: GalleryUpscaleQualityDependencies) { }

  public compute(): number | null {
    const thumbWidth = this.dependencies.firstThumb()?.getBoundingClientRect().width ?? 0;
    const viewportWidth = this.dependencies.viewportWidth();

    if (thumbWidth <= 0 || viewportWidth <= 0) {
      return null;
    }
    return this.qualityFor(thumbWidth / viewportWidth);
  }

  private qualityFor(ratio: number): number {
    const cutoff = this.dependencies.cutoffs.find(({ maxRatio }) => ratio < maxRatio);
    return cutoff?.quality ?? 1;
  }
}
