import { Readable, effect } from "@/core/utils/reactive/signal";
import { BitmapCache } from "@/core/ui/lightbox/stage/bitmap_cache";
import { Debouncer } from "@/core/utils/async/debouncer";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { doNothing } from "@/core/utils/function/function";
import { h } from "@/core/ui/h/h";

export const LightboxStageClass = {
  root: "fsg-LightboxStage",
  canvas: "fsg-LightboxStage-canvas"
} as const;

export interface LightboxStageProps {
  current: Readable<MediaItem | undefined>;
  neighbors: Readable<readonly MediaItem[]>;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalUrl: (media: Media) => Promise<string>;
  fetchOriginal: (media: Media) => Promise<Blob>;
  scheduler: Pick<Scheduler, "schedule">;
}

interface Stage {
  props: LightboxStageProps;
  cache: BitmapCache;
  originalLoads: Debouncer;
  neighborLoads: Debouncer;
}
const SETTLE_DELAY = 200;

export function LightboxStage(props: LightboxStageProps): HTMLElement {
  const canvas = <canvas className={LightboxStageClass.canvas} /> as HTMLCanvasElement;
  const stage: Stage = {
    props,
    cache: new BitmapCache(props.fetchOriginal),
    originalLoads: new Debouncer({ delay: SETTLE_DELAY }, props.scheduler),
    neighborLoads: new Debouncer({ delay: SETTLE_DELAY }, props.scheduler)
  };

  effect(() => showPost(canvas, props.current.value, stage));
  effect(() => preloadNeighbors(props.neighbors.value, stage));
  return <div className={LightboxStageClass.root}>{canvas}</div>;
}

function preloadNeighbors(neighbors: readonly MediaItem[], { props, cache: originals, neighborLoads }: Stage): void {
  const shown = props.current.peek();

  originals.keepOnly(shown === undefined ? neighbors : [shown, ...neighbors]);

  if (neighbors.length === 0) {
    neighborLoads.cancel();
    return;
  }
  neighborLoads.debounce(() => neighbors.forEach(neighbor => originals.load(neighbor).catch(doNothing)));
}

function showPost(canvas: HTMLCanvasElement, post: MediaItem | undefined, stage: Stage): void {
  clearCanvas(canvas);

  if (post === undefined) {
    stage.originalLoads.cancel();
    return;
  }
  showImage(canvas, post, stage).catch(console.error);
}

function loadOnceSettled(post: MediaItem, { cache, originalLoads }: Stage): Promise<ImageBitmap | undefined> {
  if (cache.has(post.id)) {
    return cache.load(post);
  }
  return new Promise((resolve, reject) => originalLoads.debounce(() => cache.load(post).then(resolve, reject)));
}

async function showImage(canvas: HTMLCanvasElement, post: MediaItem, stage: Stage): Promise<void> {
  const { props } = stage;
  const isShown = (): boolean => props.current.peek() === post;
  const original = loadOnceSettled(post, stage);
  let wasOriginalDrawn = false;

  loadPreview(canvas.ownerDocument, post.media, props.resolvePreviewUrl)
    .then(preview => {
      if (isShown() && !wasOriginalDrawn) {
        drawBitmap(canvas, preview);
      }
      preview.close();
    })
    .catch(console.error);
  const bitmap = await original;

  if (bitmap !== undefined && isShown()) {
    drawBitmap(canvas, bitmap);
    wasOriginalDrawn = true;
  }
}

async function loadPreview(ownerDocument: Document, media: Media, resolvePreviewUrl: LightboxStageProps["resolvePreviewUrl"]): Promise<ImageBitmap> {
  const image = ownerDocument.createElement("img");
  const url = await resolvePreviewUrl(media);

  image.src = url;
  await image.decode();
  return createImageBitmap(image);
}

function drawBitmap(canvas: HTMLCanvasElement, bitmap: ImageBitmap): void {
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
}

function clearCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}
