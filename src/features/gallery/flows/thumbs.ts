import { GalleryFlow, GalleryFlowDependencies } from "@/features/gallery/flows/flow";
import { debounceLeading, debounceTrailing } from "@/lib/async/rate_limiting";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { POSTS_PER_POST_LIST_PAGE } from "@/adapters/rule34/client/site/post_list_page/post_list_page";
import { Preference } from "@/lib/storage/preference";
import { toMediaItem } from "@/lib/ui/thumb/media_item";

export class GalleryThumbsFlow extends GalleryFlow {
  private readonly upscaleQuality: Preference<number>;
  private readonly refreshImagesDebounced: () => void;
  private readonly updateUpscaleQualityDebounced: () => void;
  private readonly upscaleAroundDebounced: (thumb: HTMLElement | null) => void;
  private readonly cacheAroundDebounced: (thumb: HTMLElement | null) => void;

  constructor(dependencies: GalleryFlowDependencies) {
    super(dependencies);
    this.upscaleQuality = this.context.environment.mode === "posts" ? this.context.preferences.postList.upscaleQuality : this.context.preferences.favorites.upscaleQuality;
    this.refreshImagesDebounced = debounceLeading(() => this.refreshImages(), GalleryConfig.contentRefreshTime);
    this.updateUpscaleQualityDebounced = debounceTrailing(() => this.updateUpscaleQualityNow(), GalleryUpscaleConfig.dynamicQualitySettleTime);
    this.upscaleAroundDebounced = debounceTrailing((thumb: HTMLElement | null) => this.withVisibleThumbsAround(thumb, (thumbs) => this.cacheOrUpscale(thumbs)), 1_000);
    this.cacheAroundDebounced = debounceTrailing((thumb: HTMLElement | null) => this.withVisibleThumbsAround(thumb, (thumbs) => this.view.cacheImages(thumbs)), 1_000);
  }

  public async refreshInitialContent(): Promise<void> {
    const { environment, events } = this.context;

    if (environment.mode === "posts" || (environment.mode === "favorites" && !(await events.favorites.storedFavoritesFound.wait()))) {
      this.refresh();
    }
  }

  public refresh(): void {
    this.view.downscaleAll();
    this.control.refreshThumbObserver();
    this.model.indexItems(this.context.shell.getContentThumbs().map(toMediaItem));
    this.refreshImagesDebounced();
  }

  public updateUpscaleQuality(): void {
    this.updateUpscaleQualityDebounced();
  }

  public toggleUpscaling(value: boolean): void {
    if (!value) {
      this.view.downscaleAll();
      return;
    }

    if (this.context.environment.mode === "posts") {
      this.cacheUnlessInfiniteScrolling();
    }
    this.view.reUpscale();

    if (this.context.environment.mode === "favorites") {
      this.view.upscale(this.control.getVisibleThumbs().slice(0, 25));
    }
  }

  public preloadPostListOnIdle(): void {
    if (GalleryConfig.preloadOutsideGalleryOnPostList) {
      this.runForState({ idle: () => this.view.cacheImages(this.context.shell.getContentThumbs()) });
    }
  }

  public handleVisibleThumbsChanged(): void {
    this.runForState({
      idle: () => this.withVisibleThumbs((thumbs) => this.cacheOrUpscale(thumbs)),
      preview: () => this.withVisibleThumbs((thumbs) => this.view.cacheImages(thumbs))
    });
  }

  public upscaleAround(thumb: HTMLElement | null): void {
    this.upscaleAroundDebounced(thumb);
  }

  public cacheAround(thumb: HTMLElement | null): void {
    this.cacheAroundDebounced(thumb);
  }

  private refreshImages(): void {
    this.runForState({
      idle: () => this.cacheFirstAndReUpscale(),
      preview: () => this.cacheFirstAndReUpscale(),
      open: () => this.view.reUpscale()
    });
  }

  private cacheFirstAndReUpscale(): void {
    if (this.context.environment.device === "desktop") {
      this.view.cacheImages(this.context.shell.getContentThumbs().slice(0, 25));
    }
    this.view.reUpscale();
  }

  private updateUpscaleQualityNow(): void {
    const quality = this.model.upscaleQualityFor(this.view.contentThumbWidth(), this.view.viewportWidth());

    if (quality !== null) {
      this.upscaleQuality.set(quality);
    }
  }

  private cacheUnlessInfiniteScrolling(): void {
    const thumbs = this.context.shell.getContentThumbs();

    if (thumbs.length <= POSTS_PER_POST_LIST_PAGE) {
      this.view.cacheImages(thumbs);
    }
  }

  private withVisibleThumbsAround(thumb: HTMLElement | null, use: (thumbs: HTMLElement[]) => void): void {
    if (thumb !== null && this.context.environment.mode === "favorites") {
      this.control.setCenterThumb(thumb);
      this.withVisibleThumbs(use);
    }
  }

  private cacheOrUpscale(thumbs: HTMLElement[]): void {
    if (this.context.environment.canvasBudget === "reduced") {
      this.view.upscale(thumbs);
    } else {
      this.view.cacheImages(thumbs);
    }
  }

  private withVisibleThumbs(use: (thumbs: HTMLElement[]) => void): void {
    if (!GalleryConfig.preloadingEnabled || this.model.isInGallery()) {
      return;
    }
    const thumbs = this.control.getVisibleThumbs();

    if (thumbs.length > 0 && thumbs.length < GalleryConfig.maxVisibleThumbsBeforeStoppingPreload) {
      Promise.resolve().then(() => use(thumbs));
    }
  }
}
