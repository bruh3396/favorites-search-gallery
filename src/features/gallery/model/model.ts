import * as GalleryItemWindow from "@/features/gallery/model/item_window";
import * as GalleryUpscaleQuality from "@/features/gallery/model/upscale_quality";
import { AddFavoriteResult, FavoritesEditor, RemoveFavoriteResult } from "@/core/boundary/ports/favorites_editor";
import { Boundary } from "@/types/boundary";
import { GalleryState } from "@/types/app";
import { GalleryStateController } from "@/features/gallery/model/state";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ItemCursor } from "@/lib/collection/item_cursor";
import { MediaSource } from "@/core/boundary/ports/media_source";
import { Links } from "@/core/boundary/ports/links";
import { NavigationKey } from "@/types/input";
import { PostMedia } from "@/core/domain/post/post";
import { Preferences } from "@/app/context/preferences";
import { downloadMedia } from "@/lib/media/download";
import { isVideo } from "@/lib/media/media_type";
import { navigationDelta } from "@/lib/event/keys";

export class GalleryModel {
  private readonly cursor: ItemCursor<PostMedia>;
  private readonly state: GalleryStateController;
  private getItemsAroundId: (id: string) => PostMedia[];

  constructor(
    preferences: Preferences,
    private readonly links: Links,
    private readonly favoritesEditor: FavoritesEditor,
    private readonly mediaSource: Pick<MediaSource, "resolveOriginalUrl" | "fetchOriginal">
  ) {
    this.cursor = new ItemCursor<PostMedia>();
    this.state = new GalleryStateController(preferences.gallery.previewEnabled.value);
    this.getItemsAroundId = (): PostMedia[] => [];
  }

  public upscaleQualityFor(thumbWidth: number, viewportWidth: number): number | null {
    return GalleryUpscaleQuality.qualityFor(thumbWidth, viewportWidth, GalleryUpscaleConfig.dynamicQualityCutoffs);
  }

  public setupWrappingWindow(getItems: () => PostMedia[]): void {
    this.getItemsAroundId = (id): PostMedia[] => GalleryItemWindow.wrappingItemsAroundId(getItems(), id);
  }

  public setupClampedWindow(getItems: () => PostMedia[]): void {
    this.getItemsAroundId = (id): PostMedia[] => GalleryItemWindow.clampedItemsAroundId(getItems(), id);
  }

  public getItemsAround(id: string): PostMedia[] {
    return this.getItemsAroundId(id);
  }

  public jumpToLast(): void {
    this.cursor.jumpToLast();
  }

  public jumpToFirst(): void {
    this.cursor.jumpToFirst();
  }

  public move(direction: NavigationKey): Boundary {
    return this.cursor.move(navigationDelta(direction));
  }

  public currentItem(): PostMedia {
    return this.cursor.currentItem();
  }

  public indexItems(items: PostMedia[]): void {
    this.cursor.indexItems(items);
  }

  public isViewingVideo(): boolean {
    return isVideo(this.cursor.currentItem());
  }

  public openPost(): void {
    this.links.openInNewTab(this.links.postUrl(this.cursor.currentItem().id));
  }

  public async openOriginal(): Promise<void> {
    this.links.openInNewTab(await this.mediaSource.resolveOriginalUrl(this.cursor.currentItem().media));
  }

  public download(): Promise<void> {
    return downloadMedia(this.mediaSource, this.cursor.currentItem());
  }

  public addFavorite(): Promise<AddFavoriteResult> {
    return this.favoritesEditor.add(this.cursor.currentItem().id);
  }

  public removeFavorite(): Promise<RemoveFavoriteResult> {
    this.favoritesEditor.remove(this.cursor.currentItem().id);
    return Promise.resolve("removed");
  }

  public getCurrentState(): GalleryState {
    return this.state.currentState;
  }

  public isIdle(): boolean {
    return this.state.isIdle;
  }

  public isInGallery(): boolean {
    return this.state.isInGallery;
  }

  public isShowingPreviews(): boolean {
    return this.state.isShowingPreviews;
  }

  public close(): void {
    this.state.close();
  }

  public preview(value: boolean): void {
    this.state.preview(value);
  }

  public open(item: PostMedia): void {
    this.cursor.pointTo(item);
    this.state.open();
  }
}
