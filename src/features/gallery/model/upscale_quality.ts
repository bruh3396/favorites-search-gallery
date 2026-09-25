import { QualityCutoff } from "@/types/app";

export class GalleryDynamicUpscaleQuality {
  constructor(
    private readonly thumbWidth: () => number | null,
    private readonly viewportWidth: () => number,
    private readonly cutoffs: QualityCutoff[]
  ) { }

  public compute(): number | null {
    const thumbWidth = this.thumbWidth();
    const viewportWidth = this.viewportWidth();

    if (thumbWidth === null || thumbWidth <= 0 || viewportWidth <= 0) {
      return null;
    }
    return this.qualityFor(thumbWidth / viewportWidth);
  }

  private qualityFor(ratio: number): number {
    const cutoff = this.cutoffs.find(({ maxRatio }) => ratio < maxRatio);
    return cutoff?.quality ?? 1;
  }
}
