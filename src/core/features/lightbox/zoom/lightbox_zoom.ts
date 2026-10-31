import { Readable, Signal, batch, computed, effect } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/media/media_item";
import { Point } from "@/core/utils/geometry/point";
import { Rect } from "@/core/utils/geometry/rect";
import { Size } from "@/core/utils/geometry/size";

export interface LightboxZoomConfiguration {
  readonly minimumScale: number;
  readonly maximumScale: number;
}

export interface LightboxZoomDependencies {
  currentItem: Readable<MediaItem | undefined>;
  mediaSize: Readable<Size | undefined>;
  enabled: Readable<boolean>;
}

export interface LightboxZoomView extends Point {
  readonly scale: number;
}

interface Zoomed {
  readonly lightboxZoomView: LightboxZoomView;
  readonly glides: boolean;
}

interface ZoomTarget {
  readonly scale: number;
  readonly point: Point;
}

interface Frame {
  readonly width: number;
  readonly height: number;
  readonly mediaWidth: number;
  readonly mediaHeight: number;
}

export const FIT_LIGHTBOX_ZOOM_VIEW: LightboxZoomView = { scale: 1, x: 0, y: 0 };

export class LightboxZoom {
  public readonly view: Readable<LightboxZoomView>;
  public readonly glides: Readable<boolean>;
  public readonly isZoomed: Readable<boolean>;
  public readonly canZoom: Readable<boolean>;
  public readonly pixelScale: Readable<number | undefined>;
  public readonly visibleRegion: Readable<Rect | undefined>;
  public readonly mediaRect: Readable<Rect | undefined>;
  private readonly zoomed = new Signal<Zoomed | undefined>(undefined);
  private readonly frameSize = new Signal<Size>({ width: 0, height: 0 });
  private readonly frame: Readable<Frame | undefined>;
  private readonly minimumScale: number;
  private readonly maximumScale: number;
  private focusPoint: Point | undefined;

  constructor(configuration: LightboxZoomConfiguration, dependencies: LightboxZoomDependencies) {
    this.minimumScale = configuration.minimumScale;
    this.maximumScale = configuration.maximumScale;
    this.frame = computed(() => (dependencies.enabled.value ? createFrame(this.frameSize.value, dependencies.mediaSize.value) : undefined));
    this.view = computed(() => this.zoomed.value?.lightboxZoomView ?? FIT_LIGHTBOX_ZOOM_VIEW);
    this.glides = computed(() => this.zoomed.value?.glides ?? true);
    this.isZoomed = computed(() => this.zoomed.value !== undefined);
    this.canZoom = computed(() => this.frame.value !== undefined);
    this.pixelScale = computed(() => {
      const zoomed = this.zoomed.value;
      const frame = this.frame.value;
      return zoomed === undefined || frame === undefined ? undefined : zoomed.lightboxZoomView.scale * computeFitRatio(frame);
    });
    this.visibleRegion = computed(() => {
      const zoomed = this.zoomed.value;
      const frame = this.frame.value;
      return zoomed === undefined || frame === undefined ? undefined : computeVisibleRegion(frame, zoomed.lightboxZoomView);
    });
    this.mediaRect = computed(() => {
      const frame = this.frame.value;
      return frame === undefined ? undefined : computeMediaRect(frame, this.view.value);
    });
    effect(() => {
      void dependencies.currentItem.value;
      void dependencies.mediaSize.value;
      void dependencies.enabled.value;
      this.zoomed.value = undefined;
    });
  }

  public setFrameSize(size: Size): void {
    batch(() => {
      this.frameSize.value = size;
      const zoomed = this.zoomed.peek();
      const frame = this.frame.peek();

      if (zoomed === undefined) {
        return;
      }
      this.zoomed.value = frame === undefined ? undefined : { lightboxZoomView: clampView(frame, zoomed.lightboxZoomView), glides: false };
    });
  }

  public setFocusPoint(point: Point | undefined): void {
    this.focusPoint = point;
  }

  public toggle(point?: Point): void {
    const frame = this.frame.peek();

    if (this.zoomed.peek() !== undefined) {
      this.zoomOut();
    } else if (frame !== undefined) {
      const scale = Math.max(1 / computeFitRatio(frame), this.minimumScale);

      this.zoomed.value = { lightboxZoomView: zoomAt(frame, FIT_LIGHTBOX_ZOOM_VIEW, { scale, point: point ?? this.focusPoint ?? computeCenter(frame) }), glides: true };
    }
  }

  public zoomBy(factor: number, point: Point): void {
    const frame = this.frame.peek();

    if (frame === undefined) {
      return;
    }
    const lightboxZoomView = this.zoomed.peek()?.lightboxZoomView ?? FIT_LIGHTBOX_ZOOM_VIEW;
    const scale = Math.min(lightboxZoomView.scale * factor, Math.max(this.maximumScale, 1 / computeFitRatio(frame)));

    this.zoomed.value = scale <= 1 ? undefined : { lightboxZoomView: zoomAt(frame, lightboxZoomView, { scale, point }), glides: false };
  }

  public panBy(dx: number, dy: number): void {
    const zoomed = this.zoomed.peek();
    const frame = this.frame.peek();

    if (zoomed !== undefined && frame !== undefined) {
      const { scale, x, y } = zoomed.lightboxZoomView;

      this.zoomed.value = { lightboxZoomView: clampView(frame, { scale, x: x + dx, y: y + dy }), glides: false };
    }
  }

  public centerAt(fractionPoint: Point): void {
    const zoomed = this.zoomed.peek();
    const frame = this.frame.peek();

    if (zoomed !== undefined && frame !== undefined) {
      const { scale } = zoomed.lightboxZoomView;
      const mediaRect = computeFittedRect(frame);
      const x = (frame.width / 2) - ((mediaRect.x + (fractionPoint.x * mediaRect.width)) * scale);
      const y = (frame.height / 2) - ((mediaRect.y + (fractionPoint.y * mediaRect.height)) * scale);

      this.zoomed.value = { lightboxZoomView: clampView(frame, { scale, x, y }), glides: true };
    }
  }

  public zoomOut(): void {
    this.zoomed.value = undefined;
  }
}

function createFrame(size: Size, mediaSize: Size | undefined): Frame | undefined {
  if (mediaSize === undefined || Math.min(size.width, size.height, mediaSize.width, mediaSize.height) <= 0) {
    return undefined;
  }
  return { width: size.width, height: size.height, mediaWidth: mediaSize.width, mediaHeight: mediaSize.height };
}

function computeCenter(frame: Frame): Point {
  return { x: frame.width / 2, y: frame.height / 2 };
}

function computeFitRatio(frame: Frame): number {
  return Math.min(frame.width / frame.mediaWidth, frame.height / frame.mediaHeight);
}

function zoomAt(frame: Frame, lightboxZoomView: LightboxZoomView, { scale, point }: ZoomTarget): LightboxZoomView {
  const localX = (point.x - lightboxZoomView.x) / lightboxZoomView.scale;
  const localY = (point.y - lightboxZoomView.y) / lightboxZoomView.scale;
  return clampView(frame, { scale, x: point.x - (localX * scale), y: point.y - (localY * scale) });
}

function computeFittedRect(frame: Frame): Rect {
  const ratio = computeFitRatio(frame);
  const width = frame.mediaWidth * ratio;
  const height = frame.mediaHeight * ratio;
  return { x: (frame.width - width) / 2, y: (frame.height - height) / 2, width, height };
}

function computeMediaRect(frame: Frame, lightboxZoomView: LightboxZoomView): Rect {
  const mediaRect = computeFittedRect(frame);
  return {
    x: (mediaRect.x * lightboxZoomView.scale) + lightboxZoomView.x,
    y: (mediaRect.y * lightboxZoomView.scale) + lightboxZoomView.y,
    width: mediaRect.width * lightboxZoomView.scale,
    height: mediaRect.height * lightboxZoomView.scale
  };
}

function computeVisibleRegion(frame: Frame, lightboxZoomView: LightboxZoomView): Rect {
  const mediaRect = computeFittedRect(frame);
  const left = clampFraction(((-lightboxZoomView.x / lightboxZoomView.scale) - mediaRect.x) / mediaRect.width);
  const top = clampFraction(((-lightboxZoomView.y / lightboxZoomView.scale) - mediaRect.y) / mediaRect.height);
  const right = clampFraction((((frame.width - lightboxZoomView.x) / lightboxZoomView.scale) - mediaRect.x) / mediaRect.width);
  const bottom = clampFraction((((frame.height - lightboxZoomView.y) / lightboxZoomView.scale) - mediaRect.y) / mediaRect.height);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function clampFraction(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampView(frame: Frame, lightboxZoomView: LightboxZoomView): LightboxZoomView {
  const { x, y, width, height } = computeFittedRect(frame);
  return {
    scale: lightboxZoomView.scale,
    x: clampOffset(lightboxZoomView.x, lightboxZoomView.scale, { start: x, size: width, frameSize: frame.width }),
    y: clampOffset(lightboxZoomView.y, lightboxZoomView.scale, { start: y, size: height, frameSize: frame.height })
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
