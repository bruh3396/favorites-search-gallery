import { Readable, Signal, batch, computed, effect } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";

export interface LightboxZoomConfiguration {
  readonly minimumScale: number;
  readonly maximumScale: number;
}

export interface LightboxZoomDependencies {
  currentItem: Readable<MediaItem | undefined>;
  mediaSize: Readable<ZoomSize | undefined>;
}

export interface ZoomSize {
  readonly width: number;
  readonly height: number;
}

export interface ZoomPoint {
  readonly x: number;
  readonly y: number;
}

export interface ZoomView extends ZoomPoint {
  readonly scale: number;
}

export interface ZoomRect extends ZoomPoint, ZoomSize {}

export interface ZoomRegion extends ZoomPoint, ZoomSize {}

interface Zoomed {
  readonly view: ZoomView;
  readonly glides: boolean;
}

interface Frame {
  readonly width: number;
  readonly height: number;
  readonly mediaWidth: number;
  readonly mediaHeight: number;
}

export const FIT_VIEW: ZoomView = { scale: 1, x: 0, y: 0 };

export class LightboxZoom {
  public readonly view: Readable<ZoomView>;
  public readonly glides: Readable<boolean>;
  public readonly isZoomed: Readable<boolean>;
  public readonly canZoom: Readable<boolean>;
  public readonly pixelScale: Readable<number | undefined>;
  public readonly visibleRegion: Readable<ZoomRegion | undefined>;
  public readonly mediaRect: Readable<ZoomRect | undefined>;
  private readonly zoomed = new Signal<Zoomed | undefined>(undefined);
  private readonly frameSize = new Signal<ZoomSize>({ width: 0, height: 0 });
  private readonly frame: Readable<Frame | undefined>;
  private readonly minimumScale: number;
  private readonly maximumScale: number;
  private focusPoint: ZoomPoint | undefined;

  constructor(configuration: LightboxZoomConfiguration, dependencies: LightboxZoomDependencies) {
    this.minimumScale = configuration.minimumScale;
    this.maximumScale = configuration.maximumScale;
    this.frame = computed(() => createFrame(this.frameSize.value, dependencies.mediaSize.value));
    this.view = computed(() => this.zoomed.value?.view ?? FIT_VIEW);
    this.glides = computed(() => this.zoomed.value?.glides ?? true);
    this.isZoomed = computed(() => this.zoomed.value !== undefined);
    this.canZoom = computed(() => this.frame.value !== undefined);
    this.pixelScale = computed(() => {
      const zoomed = this.zoomed.value;
      const frame = this.frame.value;
      return zoomed === undefined || frame === undefined ? undefined : zoomed.view.scale * computeFitRatio(frame);
    });
    this.visibleRegion = computed(() => {
      const zoomed = this.zoomed.value;
      const frame = this.frame.value;
      return zoomed === undefined || frame === undefined ? undefined : computeVisibleRegion(frame, zoomed.view);
    });
    this.mediaRect = computed(() => {
      const frame = this.frame.value;
      return frame === undefined ? undefined : computeMediaRect(frame, this.view.value);
    });
    effect(() => {
      void dependencies.currentItem.value;
      void dependencies.mediaSize.value;
      this.zoomed.value = undefined;
    });
  }

  public setFrameSize(size: ZoomSize): void {
    batch(() => {
      this.frameSize.value = size;
      const zoomed = this.zoomed.peek();
      const frame = this.frame.peek();

      if (zoomed === undefined) {
        return;
      }
      this.zoomed.value = frame === undefined ? undefined : { view: clampView(frame, zoomed.view), glides: false };
    });
  }

  public setFocusPoint(point: ZoomPoint | undefined): void {
    this.focusPoint = point;
  }

  public toggle(point?: ZoomPoint): void {
    const frame = this.frame.peek();

    if (this.zoomed.peek() !== undefined) {
      this.zoomOut();
    } else if (frame !== undefined) {
      const scale = Math.max(1 / computeFitRatio(frame), this.minimumScale);

      this.zoomed.value = { view: zoomAt(frame, FIT_VIEW, scale, point ?? this.focusPoint ?? computeCenter(frame)), glides: true };
    }
  }

  public zoomBy(factor: number, point: ZoomPoint): void {
    const frame = this.frame.peek();

    if (frame === undefined) {
      return;
    }
    const view = this.zoomed.peek()?.view ?? FIT_VIEW;
    const scale = Math.min(view.scale * factor, Math.max(this.maximumScale, 1 / computeFitRatio(frame)));

    this.zoomed.value = scale <= 1 ? undefined : { view: zoomAt(frame, view, scale, point), glides: false };
  }

  public panBy(dx: number, dy: number): void {
    const zoomed = this.zoomed.peek();
    const frame = this.frame.peek();

    if (zoomed !== undefined && frame !== undefined) {
      const { scale, x, y } = zoomed.view;

      this.zoomed.value = { view: clampView(frame, { scale, x: x + dx, y: y + dy }), glides: false };
    }
  }

  public centerAt(fraction: ZoomPoint): void {
    const zoomed = this.zoomed.peek();
    const frame = this.frame.peek();

    if (zoomed !== undefined && frame !== undefined) {
      const { scale } = zoomed.view;
      const media = computeFittedRect(frame);
      const x = (frame.width / 2) - ((media.x + (fraction.x * media.width)) * scale);
      const y = (frame.height / 2) - ((media.y + (fraction.y * media.height)) * scale);

      this.zoomed.value = { view: clampView(frame, { scale, x, y }), glides: true };
    }
  }

  public zoomOut(): void {
    this.zoomed.value = undefined;
  }
}

function createFrame(size: ZoomSize, mediaSize: ZoomSize | undefined): Frame | undefined {
  if (mediaSize === undefined || Math.min(size.width, size.height, mediaSize.width, mediaSize.height) <= 0) {
    return undefined;
  }
  return { width: size.width, height: size.height, mediaWidth: mediaSize.width, mediaHeight: mediaSize.height };
}

function computeCenter(frame: Frame): ZoomPoint {
  return { x: frame.width / 2, y: frame.height / 2 };
}

function computeFitRatio(frame: Frame): number {
  return Math.min(frame.width / frame.mediaWidth, frame.height / frame.mediaHeight);
}

function zoomAt(frame: Frame, view: ZoomView, scale: number, point: ZoomPoint): ZoomView {
  const localX = (point.x - view.x) / view.scale;
  const localY = (point.y - view.y) / view.scale;
  return clampView(frame, { scale, x: point.x - (localX * scale), y: point.y - (localY * scale) });
}

function computeFittedRect(frame: Frame): ZoomRect {
  const ratio = computeFitRatio(frame);
  const width = frame.mediaWidth * ratio;
  const height = frame.mediaHeight * ratio;
  return { x: (frame.width - width) / 2, y: (frame.height - height) / 2, width, height };
}

function computeMediaRect(frame: Frame, view: ZoomView): ZoomRect {
  const media = computeFittedRect(frame);
  return {
    x: (media.x * view.scale) + view.x,
    y: (media.y * view.scale) + view.y,
    width: media.width * view.scale,
    height: media.height * view.scale
  };
}

function computeVisibleRegion(frame: Frame, view: ZoomView): ZoomRegion {
  const media = computeFittedRect(frame);
  const left = clampFraction(((-view.x / view.scale) - media.x) / media.width);
  const top = clampFraction(((-view.y / view.scale) - media.y) / media.height);
  const right = clampFraction((((frame.width - view.x) / view.scale) - media.x) / media.width);
  const bottom = clampFraction((((frame.height - view.y) / view.scale) - media.y) / media.height);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function clampFraction(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampView(frame: Frame, view: ZoomView): ZoomView {
  const { x, y, width, height } = computeFittedRect(frame);
  return {
    scale: view.scale,
    x: clampOffset(view.x, view.scale, { start: x, size: width, frameSize: frame.width }),
    y: clampOffset(view.y, view.scale, { start: y, size: height, frameSize: frame.height })
  };
}

interface Span {
  readonly start: number;
  readonly size: number;
  readonly frameSize: number;
}

function clampOffset(offset: number, scale: number, { start, size, frameSize }: Span): number {
  const scaledSize = size * scale;

  if (scaledSize <= frameSize) {
    return ((frameSize - scaledSize) / 2) - (start * scale);
  }
  return Math.min(-start * scale, Math.max(frameSize - ((start + size) * scale), offset));
}
