import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";

export interface LightboxZoomConfiguration {
  readonly minimumScale: number;
}

export interface LightboxZoomDependencies {
  current: Readable<MediaItem | undefined>;
}

export interface ZoomFrame {
  readonly width: number;
  readonly height: number;
  readonly mediaWidth: number;
  readonly mediaHeight: number;
}

export interface ZoomPoint {
  readonly x: number;
  readonly y: number;
}

export interface ZoomView extends ZoomPoint {
  readonly scale: number;
}

export type ZoomDirection = "in" | "out";

export interface ZoomRegion {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

interface ZoomedItem {
  readonly item: MediaItem;
  readonly frame: ZoomFrame;
  readonly view: ZoomView;
  readonly glides: boolean;
}

interface Box extends ZoomPoint {
  readonly width: number;
  readonly height: number;
}

export const FIT_VIEW: ZoomView = { scale: 1, x: 0, y: 0 };

const MAXIMUM_SCALE_PAST_DETAIL = 2;
const FITTED_SCALE_TOLERANCE = 0.001;

export class LightboxZoom {
  public readonly view: Readable<ZoomView>;
  public readonly glides: Readable<boolean>;
  public readonly isZoomed: Readable<boolean>;
  public readonly canZoom: Readable<boolean>;
  public readonly toggleDirection: Readable<ZoomDirection | undefined>;
  public readonly magnification: Readable<number | undefined>;
  public readonly visibleRegion: Readable<ZoomRegion | undefined>;
  private readonly zoomed = new Signal<ZoomedItem | undefined>(undefined);
  private readonly stopEffect: () => void;

  constructor(private readonly configuration: LightboxZoomConfiguration, private readonly dependencies: LightboxZoomDependencies) {
    this.view = computed(() => this.zoomed.value?.view ?? FIT_VIEW);
    this.glides = computed(() => this.zoomed.value?.glides ?? true);
    this.isZoomed = computed(() => this.zoomed.value !== undefined);
    this.canZoom = computed(() => isZoomable(dependencies.current.value));
    this.toggleDirection = computed(() => {
      if (this.isZoomed.value) {
        return "out";
      }
      return this.canZoom.value ? "in" : undefined;
    });
    this.magnification = computed(() => {
      const zoomed = this.zoomed.value;
      return zoomed === undefined ? undefined : zoomed.view.scale * fitRatio(zoomed.frame);
    });
    this.visibleRegion = computed(() => {
      const zoomed = this.zoomed.value;
      return zoomed === undefined ? undefined : findVisibleRegion(zoomed.frame, zoomed.view);
    });
    this.stopEffect = effect(() => {
      if (this.zoomed.peek()?.item !== dependencies.current.value) {
        this.zoomOut();
      }
    });
  }

  public toggle(frame: ZoomFrame, point: ZoomPoint = centerOf(frame)): void {
    if (this.zoomed.peek() !== undefined) {
      this.zoomOut();
    } else {
      this.zoomTo(frame, () => this.findDetailScale(frame), point, true);
    }
  }

  public zoomBy(frame: ZoomFrame, factor: number, point: ZoomPoint = centerOf(frame)): void {
    const scale = this.view.peek().scale * factor;

    if (scale <= 1 + FITTED_SCALE_TOLERANCE) {
      this.zoomOut();
    } else {
      this.zoomTo(frame, () => Math.min(scale, this.findDetailScale(frame) * MAXIMUM_SCALE_PAST_DETAIL), point, false);
    }
  }

  public zoomOut(): void {
    this.zoomed.value = undefined;
  }

  public panBy(frame: ZoomFrame, deltaX: number, deltaY: number): void {
    const zoomed = this.zoomed.peek();

    if (zoomed !== undefined) {
      const { view } = zoomed;

      this.zoomed.value = { item: zoomed.item, frame, view: clampView(frame, { scale: view.scale, x: view.x + deltaX, y: view.y + deltaY }), glides: false };
    }
  }

  public dispose(): void {
    this.stopEffect();
  }

  private zoomTo(frame: ZoomFrame, chooseScale: () => number, point: ZoomPoint, glides: boolean): void {
    const item = this.dependencies.current.peek();

    if (item !== undefined && isZoomable(item) && hasArea(frame)) {
      this.zoomed.value = { item, frame, view: zoomAt(frame, this.view.peek(), chooseScale(), point), glides };
    }
  }

  private findDetailScale(frame: ZoomFrame): number {
    return Math.max(1 / fitRatio(frame), this.configuration.minimumScale);
  }
}

function isZoomable(item: MediaItem | undefined): boolean {
  return item !== undefined && item.media.kind !== "video";
}

function hasArea(frame: ZoomFrame): boolean {
  return Math.min(frame.width, frame.height, frame.mediaWidth, frame.mediaHeight) > 0;
}

function centerOf(frame: ZoomFrame): ZoomPoint {
  return { x: frame.width / 2, y: frame.height / 2 };
}

function fitRatio(frame: ZoomFrame): number {
  return Math.min(frame.width / frame.mediaWidth, frame.height / frame.mediaHeight);
}

function fitBox(frame: ZoomFrame): Box {
  const ratio = fitRatio(frame);
  const width = frame.mediaWidth * ratio;
  const height = frame.mediaHeight * ratio;
  return { x: (frame.width - width) / 2, y: (frame.height - height) / 2, width, height };
}

function zoomAt(frame: ZoomFrame, view: ZoomView, scale: number, point: ZoomPoint): ZoomView {
  const localX = (point.x - view.x) / view.scale;
  const localY = (point.y - view.y) / view.scale;
  return clampView(frame, { scale, x: point.x - localX * scale, y: point.y - localY * scale });
}

function clampView(frame: ZoomFrame, view: ZoomView): ZoomView {
  const box = fitBox(frame);
  return {
    scale: view.scale,
    x: clampOffset(view.x, view.scale, box.x, box.width, frame.width),
    y: clampOffset(view.y, view.scale, box.y, box.height, frame.height)
  };
}

function clampOffset(offset: number, scale: number, start: number, size: number, frameSize: number): number {
  const scaledSize = size * scale;

  if (scaledSize <= frameSize) {
    return (frameSize - scaledSize) / 2 - start * scale;
  }
  return Math.min(0 - start * scale, Math.max(frameSize - (start + size) * scale, offset));
}

function findVisibleRegion(frame: ZoomFrame, view: ZoomView): ZoomRegion {
  const box = fitBox(frame);
  const [left, right] = findVisibleSpan(view.x, view.scale, box.x, box.width, frame.width);
  const [top, bottom] = findVisibleSpan(view.y, view.scale, box.y, box.height, frame.height);
  return { left, top, width: right - left, height: bottom - top };
}

function findVisibleSpan(offset: number, scale: number, start: number, size: number, frameSize: number): [start: number, end: number] {
  const shownStart = offset + start * scale;
  const shownSize = size * scale;
  return [Math.max(0, -shownStart / shownSize), Math.min(1, (frameSize - shownStart) / shownSize)];
}
