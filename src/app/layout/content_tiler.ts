import { clamp, navigationDelta } from "@/utils/pure/number";
import { AbstractTiler } from "@/lib/ui/tilers/abstract_tiler";
import { AppContext } from "@/app/context/context";
import { ColumnTiler } from "@/lib/ui/tilers/column_tiler";
import { ContentDisplayOptions } from "@/types/ui";
import { Emitter } from "@/lib/event/emitter";
import { EnhancedWheelEvent } from "@/lib/event/input";
import { Fader } from "@/app/layout/fader";
import { GridTiler } from "@/lib/ui/tilers/grid_tiler";
import { Layout } from "@/types/app";
import { NativeTiler } from "@/lib/ui/tilers/native_tiler";
import { Preference } from "@/lib/storage/preference";
import { RowTiler } from "@/lib/ui/tilers/row_tiler";
import { SquareTiler } from "@/lib/ui/tilers/square_tiler";
import { ThumbConfig } from "@/config/thumb_config";

interface ContentTilerConfig {
  content: HTMLElement;
  layout: Preference<Layout>;
  columnCount: Preference<number>;
  rowHeight: Preference<number>;
  wheel: Emitter<EnhancedWheelEvent>;
  galleryOpened: () => boolean;
  maxColumnCount: number;
  fadeThumbs: boolean;
}

function resolveConfig(context: AppContext): ContentTilerConfig {
  const { environment, preferences, domEvents, featureBridge, shell } = context;
  const onFavoritesPage = environment.onFavoritesPage;
  const settings = onFavoritesPage ? preferences.favorites : preferences.postList;
  const maxColumnCount = onFavoritesPage ? (environment.onMobileDevice ? ThumbConfig.columnCountBounds.max.mobile : ThumbConfig.columnCountBounds.max.desktop) : (environment.onDesktopDevice ? ThumbConfig.columnCountBounds.max.desktop : 10);
  return {
    content: shell.content,
    layout: settings.layout,
    columnCount: settings.columnCount,
    rowHeight: settings.rowHeight,
    wheel: domEvents.document.wheel,
    galleryOpened: (): boolean => featureBridge.galleryOpened(),
    maxColumnCount,
    fadeThumbs: preferences.app.fadeThumbs.value
  };
}

export class ContentTiler {
  private readonly config: ContentTilerConfig;
  private readonly columnTiler: ColumnTiler;
  private readonly tilers: AbstractTiler[];
  private readonly tilerMap: Map<Layout, AbstractTiler>;
  private readonly fade: Fader;
  private currentLayout: Layout;
  private currentTiler: AbstractTiler;

  constructor(context: AppContext) {
    const config = resolveConfig(context);

    this.config = config;
    this.columnTiler = new ColumnTiler(config.content, config.columnCount.value);
    this.tilers = [this.columnTiler, new GridTiler(config.content), new RowTiler(config.content), new SquareTiler(config.content), new NativeTiler(config.content)];
    this.tilerMap = new Map(this.tilers.map(tiler => [tiler.layout, tiler]));
    this.fade = new Fader(config.fadeThumbs, () => this.config.columnCount.value);
    this.currentLayout = config.layout.value;
    this.currentTiler = this.tilerMap.get(this.currentLayout) ?? this.columnTiler;
  }

  public setup(): void {
    this.currentTiler.activate();
    this.setColumnCount(this.config.columnCount.value);
    this.setRowHeight(this.config.rowHeight.value);
    this.config.wheel.on((event) => this.changeItemSizeOnShiftScroll(event));
    this.config.columnCount.on((columnCount) => this.setColumnCount(columnCount));
    this.config.rowHeight.on((rowHeight) => this.setRowHeight(rowHeight));
  }

  public changeLayout(layout: Layout): void {
    if (this.currentLayout === layout) {
      return;
    }
    this.currentTiler.deactivate();
    this.currentLayout = layout;
    this.currentTiler = this.tilerMap.get(layout) ?? this.columnTiler;
    this.currentTiler.activate();
  }

  public setRowHeight(rowHeight: number): void {
    this.tilers.forEach(tiler => tiler.setRowHeight(rowHeight));
  }

  public setColumnCount(columnCount: number): void {
    this.tilers.forEach(tiler => tiler.setColumnCount(columnCount));
  }

  public getLayout(): Layout {
    return this.currentLayout;
  }

  public tile(items: HTMLElement[], options: ContentDisplayOptions = { fade: true }): void {
    if (options.fade) {
      this.fade.fadeInReplacement(items, () => this.currentTiler.tile(items));
    } else {
      this.fade.clearFade(items);
      this.currentTiler.tile(items);
    }
  }

  public addToBottom(items: HTMLElement[]): void {
    this.fade.fadeIn(items, () => this.currentTiler.addItemsToBottom(items));
  }

  public addToTop(items: HTMLElement[]): void {
    this.fade.fadeIn(items, () => this.currentTiler.addItemsToTop(items));
  }

  public bottomEdgeElements(): HTMLElement[] {
    return this.currentTiler.bottomEdgeElements();
  }

  private changeItemSizeOnShiftScroll(wheelEvent: EnhancedWheelEvent): void {
    if (!wheelEvent.originalEvent.shiftKey || this.currentLayout === "native" || this.config.galleryOpened()) {
      return;
    }
    const usingRowLayout = this.currentLayout === "row";
    const direction = navigationDelta(wheelEvent.direction);
    const delta = usingRowLayout ? -direction : direction;
    const preference = usingRowLayout ? this.config.rowHeight : this.config.columnCount;
    const min = usingRowLayout ? ThumbConfig.rowHeightBounds.min : ThumbConfig.columnCountBounds.min;
    const max = usingRowLayout ? ThumbConfig.rowHeightBounds.max : this.config.maxColumnCount;

    preference.set(clamp(preference.value + delta, min, max));
  }
}
