import * as GalleryItemWindow from "@/features/gallery/model/item_window";
import * as GalleryUpscaleQuality from "@/features/gallery/model/upscale_quality";
import { AddFavoriteStatus, FavoritesEditor, Navigation, RemoveFavoriteStatus } from "@/core/boundary/ports";
import { GalleryState, Identifiable } from "@/types/app";
import { Boundary } from "@/types/boundary";
import { GalleryStateController } from "@/features/gallery/model/state";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ItemCursor } from "@/lib/collection/item_cursor";
import { MediaItem } from "@/types/media";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { downloadMedia } from "@/lib/media/download";
import { isVideo } from "@/lib/media/media_type";
import { navigationDelta } from "@/lib/event/keys";

export class GalleryModel {
  private readonly cursor: ItemCursor<MediaItem>;
  private readonly state: GalleryStateController;
  private getThumbsAround: (id: string) => MediaItem[];

  constructor(preferences: Preferences, private readonly navigation: Navigation, private readonly favoritesEditor: FavoritesEditor) {
    this.cursor = new ItemCursor<MediaItem>();
    this.state = new GalleryStateController(preferences.gallery.previewEnabled.value);
    this.getThumbsAround = (): MediaItem[] => [];
  }

  public upscaleQualityFor(thumbWidth: number, viewportWidth: number): number | null {
    return GalleryUpscaleQuality.qualityFor(thumbWidth, viewportWidth, GalleryUpscaleConfig.dynamicQualityCutoffs);
  }

  public setupWrappingWindow<T extends Identifiable>(getItems: () => T[], toItem: (item: T) => MediaItem): void {
    this.getThumbsAround = (id): MediaItem[] => GalleryItemWindow.wrappingThumbsAroundId(getItems(), id, toItem);
  }

  public setupClampedWindow<T extends Identifiable>(getItems: () => T[], toItem: (item: T) => MediaItem): void {
    this.getThumbsAround = (id): MediaItem[] => GalleryItemWindow.clampedThumbsAroundId(getItems(), id, toItem);
  }

  public getItemsAround(id: string): MediaItem[] {
    return this.getThumbsAround(id);
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

  public currentItem(): MediaItem {
    return this.cursor.currentItem();
  }

  public indexItems(items: MediaItem[]): void {
    this.cursor.indexItems(items);
  }

  public isViewingVideo(): boolean {
    return isVideo(this.cursor.currentItem());
  }

  public openPost(): void {
    this.navigation.openPost(this.cursor.currentItem().id);
  }

  public openMedia(): void {
    this.navigation.openMedia(this.cursor.currentItem());
  }

  public download(): Promise<void> {
    return downloadMedia(this.cursor.currentItem());
  }

  public addFavorite(): Promise<AddFavoriteStatus> {
    return this.favoritesEditor.add(this.cursor.currentItem().id);
  }

  public removeFavorite(): Promise<RemoveFavoriteStatus> {
    this.favoritesEditor.remove(this.cursor.currentItem().id);
    return Promise.resolve("success");
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

  public open(item: MediaItem): void {
    this.cursor.pointTo(item);
    this.state.open();
  }
}
