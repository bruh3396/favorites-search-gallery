/* eslint-disable no-warning-comments */
// TODO: temporary experiment comparing lightbox sharpness (ideas.md, "Sharp lightbox resample"). Delete once a mode is chosen.
import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";

type CanvasSize =
  | { kind: "fixed"; width: number; height: number }
  | { kind: "screen"; multiplier: number }
  | { kind: "original" };

type SharpnessMode =
  | { name: string; kind: "plain" }
  | { name: string; kind: "exact" }
  | { name: string; kind: "canvas"; size: CanvasSize; smoothing: ImageSmoothingQuality };

const MODES: Record<string, SharpnessMode> = {
  1: { name: "plain img", kind: "plain" },
  2: { name: "exact (high-quality resize to screen)", kind: "exact" },
  3: { name: "canvas 7680×4320 (old gallery)", kind: "canvas", size: { kind: "fixed", width: 7680, height: 4320 }, smoothing: "low" },
  4: { name: "canvas 3840×2160", kind: "canvas", size: { kind: "fixed", width: 3840, height: 2160 }, smoothing: "low" },
  5: { name: "canvas 2× screen", kind: "canvas", size: { kind: "screen", multiplier: 2 }, smoothing: "low" },
  6: { name: "canvas 3× screen", kind: "canvas", size: { kind: "screen", multiplier: 3 }, smoothing: "low" },
  7: { name: "canvas 7680×4320, high smoothing", kind: "canvas", size: { kind: "fixed", width: 7680, height: 4320 }, smoothing: "high" },
  8: { name: "canvas at the original's own size (no resize)", kind: "canvas", size: { kind: "original" }, smoothing: "low" },
  9: { name: "canvas 1× screen", kind: "canvas", size: { kind: "screen", multiplier: 1 }, smoothing: "low" }
};
const LEGEND = "[1–9]";
const mode = new Signal<SharpnessMode>(MODES[1]);

export function selectSharpnessMode(key: string): boolean {
  const selected = MODES[key];

  if (selected !== undefined) {
    mode.value = selected;
  }
  return selected !== undefined;
}

export function mountSharpnessExperiment(stage: HTMLElement, image: HTMLImageElement, current: Readable<MediaItem | undefined>, fetchOriginal: (media: Media) => Promise<Blob>): void {
  const document = stage.ownerDocument;
  const canvas = document.createElement("canvas");
  const label = document.createElement("div");
  const loaded: { post?: MediaItem; bitmap?: ImageBitmap } = {};

  stage.style.position = "relative";
  canvas.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: auto;";
  label.style.cssText = "position: fixed; top: 8px; left: 8px; padding: 4px 8px; background: rgb(0 0 0 / 0.7); color: white; font: 14px monospace; pointer-events: none; white-space: pre;";
  stage.append(canvas, label);
  effect(() => {
    render({ stage, image, canvas, label, loaded, current, fetchOriginal }, current.value, mode.value).catch(console.error);
  });
}

interface Experiment {
  stage: HTMLElement;
  image: HTMLImageElement;
  canvas: HTMLCanvasElement;
  label: HTMLElement;
  loaded: { post?: MediaItem; bitmap?: ImageBitmap };
  current: Readable<MediaItem | undefined>;
  fetchOriginal: (media: Media) => Promise<Blob>;
}

async function render(experiment: Experiment, post: MediaItem | undefined, selected: SharpnessMode): Promise<void> {
  const { image, canvas, label, loaded, current, fetchOriginal } = experiment;

  label.textContent = `${selected.name}   ${LEGEND}`;
  canvas.hidden = selected.kind === "plain" || post === undefined;
  image.style.visibility = canvas.hidden ? "" : "hidden";

  if (canvas.hidden || post === undefined) {
    return;
  }

  if (loaded.post !== post) {
    label.textContent += "   loading…";
    const bitmap = await createImageBitmap(await fetchOriginal(post.media));

    if (current.peek() !== post) {
      bitmap.close();
      return;
    }
    loaded.bitmap?.close();
    loaded.post = post;
    loaded.bitmap = bitmap;
  }

  if (mode.peek() !== selected || current.peek() !== post || loaded.bitmap === undefined) {
    return;
  }

  if (selected.kind === "exact") {
    await drawExact(experiment, loaded.bitmap);
  } else if (selected.kind === "canvas") {
    drawOnCanvas(experiment, loaded.bitmap, selected);
  }
  label.textContent = `${selected.name}   canvas ${canvas.width}×${canvas.height}   original ${loaded.bitmap.width}×${loaded.bitmap.height}   ${LEGEND}`;
}

function readScreenPixels(stage: HTMLElement): { width: number; height: number } {
  const pixelRatio = stage.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  return { width: Math.round(stage.clientWidth * pixelRatio), height: Math.round(stage.clientHeight * pixelRatio) };
}

async function drawExact({ stage, canvas }: Experiment, bitmap: ImageBitmap): Promise<void> {
  const { width, height } = readScreenPixels(stage);
  const scale = Math.min(width / bitmap.width, height / bitmap.height);
  const resized = await createImageBitmap(bitmap, {
    resizeWidth: Math.round(bitmap.width * scale),
    resizeHeight: Math.round(bitmap.height * scale),
    resizeQuality: "high"
  });

  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(resized, Math.round((width - resized.width) / 2), Math.round((height - resized.height) / 2));
  resized.close();
}

function measureCanvas(stage: HTMLElement, bitmap: ImageBitmap, size: CanvasSize): { width: number; height: number } {
  if (size.kind === "original") {
    return { width: bitmap.width, height: bitmap.height };
  }

  if (size.kind === "fixed") {
    return size;
  }
  const screen = readScreenPixels(stage);
  return { width: screen.width * size.multiplier, height: screen.height * size.multiplier };
}

function drawOnCanvas({ stage, canvas }: Experiment, bitmap: ImageBitmap, { size, smoothing }: { size: CanvasSize; smoothing: ImageSmoothingQuality }): void {
  const { width: canvasWidth, height: canvasHeight } = measureCanvas(stage, bitmap, size);
  const scale = Math.min(canvasWidth / bitmap.width, canvasHeight / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");

  if (context !== null) {
    context.imageSmoothingQuality = smoothing;
    context.drawImage(bitmap, (canvasWidth - width) / 2, (canvasHeight - height) / 2, width, height);
  }
}
