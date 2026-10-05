import * as GalleryItemWindow from "@/features/gallery/model/item_window";
import * as GalleryUpscaleQuality from "@/features/gallery/model/upscale_quality";
import { AddFavoriteResult, RemoteFavoriteActions, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { Boundary } from "@/types/boundary";
import { GalleryState } from "@/types/app";
import { GalleryStateController } from "@/features/gallery/model/state";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ItemCursor } from "@/lib/collection/item_cursor";
import { NavigationKey } from "@/types/input";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { MediaItem } from "@/core/domain/post/post";
import { Preferences } from "@/app/context/preferences";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { downloadMedia } from "@/lib/media/download";
import { isVideo } from "@/lib/media/media_type";
import { navigationDelta } from "@/lib/event/keys";

interface GalleryModelPorts {
  navigator: Navigator;
  remotePages: Pick<RemotePages, "postUrl">;
  remoteFavoriteActions: RemoteFavoriteActions;
  remoteMedia: Pick<RemoteMedia, "resolveOriginalUrl" | "fetchOriginal">;
}

export class GalleryModel {
  private readonly cursor: ItemCursor<MediaItem>;
  private readonly state: GalleryStateController;
  private getItemsAroundId: (id: string) => MediaItem[];

  constructor(preferences: Preferences, private readonly ports: GalleryModelPorts) {
    this.cursor = new ItemCursor<MediaItem>();
    this.state = new GalleryStateController(preferences.gallery.previewEnabled.value);
    this.getItemsAroundId = (): MediaItem[] => [];
  }

  public upscaleQualityFor(thumbWidth: number, viewportWidth: number): number | null {
    return GalleryUpscaleQuality.qualityFor(thumbWidth, viewportWidth, GalleryUpscaleConfig.dynamicQualityCutoffs);
  }

  public setupWrappingWindow(getItems: () => MediaItem[]): void {
    this.getItemsAroundId = (id): MediaItem[] => GalleryItemWindow.wrappingItemsAroundId(getItems(), id);
  }

  public setupClampedWindow(getItems: () => MediaItem[]): void {
    this.getItemsAroundId = (id): MediaItem[] => GalleryItemWindow.clampedItemsAroundId(getItems(), id);
  }

  public getItemsAround(id: string): MediaItem[] {
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
    this.ports.navigator.open(this.ports.remotePages.postUrl(this.cursor.currentItem().id));
  }

  public async openOriginal(): Promise<void> {
    this.ports.navigator.open(await this.ports.remoteMedia.resolveOriginalUrl(this.cursor.currentItem().media));
  }

  public download(): Promise<void> {
    return downloadMedia(this.ports.remoteMedia, this.cursor.currentItem());
  }

  public addFavorite(): Promise<AddFavoriteResult> {
    return this.ports.remoteFavoriteActions.add(this.cursor.currentItem().id);
  }

  public removeFavorite(): Promise<RemoveFavoriteResult> {
    this.ports.remoteFavoriteActions.remove(this.cursor.currentItem().id);
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

  public open(item: MediaItem): void {
    this.cursor.pointTo(item);
    this.state.open();
  }
}
