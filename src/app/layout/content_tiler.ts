import { AbstractTiler } from "@/lib/ui/tilers/abstract_tiler";
import { AppContext } from "@/app/context/context";
import { ColumnTiler } from "@/lib/ui/tilers/column_tiler";
import { Emitter } from "@/core/utils/reactive/emitter";
import { EnhancedWheelEvent } from "@/lib/event/input";
import { GridTiler } from "@/lib/ui/tilers/grid_tiler";
import { Layout } from "@/types/app";
import { NativeTiler } from "@/lib/ui/tilers/native_tiler";
import { Preference } from "@/lib/storage/preference";
import { RowTiler } from "@/lib/ui/tilers/row_tiler";
import { SquareTiler } from "@/lib/ui/tilers/square_tiler";
import { ThumbConfig } from "@/config/thumb_config";
import { clamp } from "@/core/utils/number/number";
import { navigationDelta } from "@/lib/event/keys";

interface ContentTilerConfiguration {
  maxColumnCount: number;
}

interface ContentTilerDependencies {
  content: HTMLElement;
  layout: Preference<Layout>;
  columnCount: Preference<number>;
  rowHeight: Preference<number>;
  wheel: Emitter<EnhancedWheelEvent>;
  galleryOpened: () => boolean;
}

function resolveConfiguration({ environment }: AppContext): ContentTilerConfiguration {
  const { max } = ThumbConfig.columnCountBounds;
  const { device, mode } = environment;
  const maxColumnCount = mode === "favorites" ? max[device] : (device === "desktop" ? max.desktop : 10);
  return { maxColumnCount };
}

function resolveDependencies(context: AppContext): ContentTilerDependencies {
  const { environment, preferences, domEvents, featureBridge, shell } = context;
  const settings = environment.mode === "favorites" ? preferences.favorites : preferences.postList;
  return {
    content: shell.content,
    layout: settings.layout,
    columnCount: settings.columnCount,
    rowHeight: settings.rowHeight,
    wheel: domEvents.document.wheel,
    galleryOpened: (): boolean => featureBridge.galleryOpened()
  };
}

export class ContentTiler {
  private readonly configuration: ContentTilerConfiguration;
  private readonly dependencies: ContentTilerDependencies;
  private readonly columnTiler: ColumnTiler;
  private readonly tilers: AbstractTiler[];
  private readonly tilerMap: Map<Layout, AbstractTiler>;
  private currentLayout: Layout;
  private currentTiler: AbstractTiler;

  constructor(context: AppContext) {
    const configuration = resolveConfiguration(context);
    const dependencies = resolveDependencies(context);
    const { content, columnCount } = dependencies;

    this.configuration = configuration;
    this.dependencies = dependencies;
    this.columnTiler = new ColumnTiler(content, columnCount.value);
    this.tilers = [
      this.columnTiler,
      new GridTiler(content),
      new RowTiler(content),
      new SquareTiler(content),
      new NativeTiler(content)
    ];
    this.tilerMap = new Map(this.tilers.map(tiler => [tiler.layout, tiler]));
    this.currentLayout = dependencies.layout.value;
    this.currentTiler = this.tilerMap.get(this.currentLayout) ?? this.columnTiler;
  }

  public setup(): void {
    const { columnCount, rowHeight, wheel } = this.dependencies;

    this.currentTiler.activate();
    this.setColumnCount(columnCount.value);
    this.setRowHeight(rowHeight.value);
    wheel.on(event => this.changeItemSizeOnShiftScroll(event));
    columnCount.on(count => this.setColumnCount(count));
    rowHeight.on(height => this.setRowHeight(height));
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

  public tile(items: HTMLElement[]): void {
    if (this.dependencies.content.childElementCount > 0 && this.currentTiler.reTile(items)) {
      return;
    }
    this.currentTiler.tile(items);
  }

  public addToBottom(items: HTMLElement[]): void {
    this.currentTiler.addItemsToBottom(items);
  }

  public addToTop(items: HTMLElement[]): void {
    this.currentTiler.addItemsToTop(items);
  }

  public bottomEdgeElements(): HTMLElement[] {
    return this.currentTiler.bottomEdgeElements();
  }

  private changeItemSizeOnShiftScroll(wheelEvent: EnhancedWheelEvent): void {
    if (!wheelEvent.originalEvent.shiftKey || this.currentLayout === "native" || this.dependencies.galleryOpened()) {
      return;
    }
    const usingRowLayout = this.currentLayout === "row";
    const direction = navigationDelta(wheelEvent.direction);
    const delta = usingRowLayout ? -direction : direction;
    const preference = usingRowLayout ? this.dependencies.rowHeight : this.dependencies.columnCount;
    const min = usingRowLayout ? ThumbConfig.rowHeightBounds.min : ThumbConfig.columnCountBounds.min;
    const max = usingRowLayout ? ThumbConfig.rowHeightBounds.max : this.configuration.maxColumnCount;

    preference.set(clamp(preference.value + delta, min, max));
  }
}
