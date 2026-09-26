import { GalleryViewedPostDependencies } from "@/features/gallery/types/types";

export class GalleryViewedPost {
  constructor(private readonly dependencies: GalleryViewedPostDependencies) { }

  public get(): HTMLElement | null {
    return this.dependencies.isInGallery() ? this.dependencies.currentThumb() : null;
  }

  public isVideo(): boolean {
    const thumb = this.get();
    return thumb !== null && this.dependencies.isVideoThumb(thumb);
  }
}
