import * as Actions from "@/lib/remote/fetchers/action";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { GalleryState, Identifiable } from "@/types/app";
import { addFavoriteFromThumb, removeFavoriteFromThumb } from "@/lib/ui/thumb/favorite_actions";
import { clampedThumbsAroundId, wrappingThumbsAroundId } from "@/features/gallery/model/item_window";
import { Boundary } from "@/types/boundary";
import { GalleryDynamicUpscaleQuality } from "@/features/gallery/model/upscale_quality";
import { GalleryStateController } from "@/features/gallery/model/state";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { ItemCursor } from "@/lib/collection/item_cursor";
import { MediaItem } from "@/types/media";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";
import { downloadFromThumb } from "@/lib/media/download";
import { isVideoThumb } from "@/lib/ui/thumb/media_item";
import { navigationDelta } from "@/utils/pure/number";

export class GalleryModel {
  private readonly cursor: ItemCursor<HTMLElement>;
  private readonly state: GalleryStateController;
  private readonly quality: GalleryDynamicUpscaleQuality;
  private getThumbsAround: (id: string) => MediaItem[];

  constructor(preferences: Preferences, shell: Shell) {
    this.cursor = new ItemCursor<HTMLElement>();
    this.state = new GalleryStateController(preferences.gallery.previewEnabled.value ? "preview" : "idle");
    this.quality = new GalleryDynamicUpscaleQuality(() => shell.getFirstContentThumb()?.getBoundingClientRect().width ?? null, () => window.innerWidth, GalleryUpscaleConfig.dynamicQualityCutoffs);
    this.getThumbsAround = (): MediaItem[] => [];
  }

  public computeUpscaleQuality(): number | null {
    return this.quality.compute();
  }

  public setupWrappingWindow<T extends Identifiable>(getItems: () => T[], toItem: (item: T) => MediaItem): void {
    this.getThumbsAround = (id): MediaItem[] => wrappingThumbsAroundId(getItems(), id, toItem);
  }

  public setupClampedWindow<T extends Identifiable>(getItems: () => T[], toItem: (item: T) => MediaItem): void {
    this.getThumbsAround = (id): MediaItem[] => clampedThumbsAroundId(getItems(), id, toItem);
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

  public currentThumb(): HTMLElement {
    return this.cursor.currentItem();
  }

  public pointTo(thumb: HTMLElement): void {
    this.cursor.pointTo(thumb);
  }

  public indexThumbs(source: HTMLElement[]): void {
    this.cursor.indexItems(source);
  }

  public isViewingVideo(): boolean {
    return this.state.isInGallery && isVideoThumb(this.cursor.currentItem());
  }

  public openPost(): void {
    Actions.openPost(this.cursor.currentItem().id);
  }

  public openMedia(): Promise<void> {
    return Actions.openMedia(this.cursor.currentItem());
  }

  public download(): Promise<void> {
    return downloadFromThumb(this.cursor.currentItem());
  }

  public addFavorite(): Promise<AddFavoriteStatus> {
    return addFavoriteFromThumb(this.cursor.currentItem());
  }

  public removeFavorite(): Promise<RemoveFavoriteStatus> {
    return removeFavoriteFromThumb(this.cursor.currentItem());
  }

  public getCurrentState(): GalleryState {
    return this.state.currentState;
  }

  public currentThumbIfOpen(): HTMLElement | null {
    return this.state.isInGallery ? this.cursor.currentItem() : null;
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

  public open(thumb: HTMLElement): void {
    this.cursor.pointTo(thumb);
    this.state.open();
  }
}
