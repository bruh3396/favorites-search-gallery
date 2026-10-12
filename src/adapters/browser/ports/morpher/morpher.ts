import { MorphSource, Morpher } from "@/core/boundary/ports/morpher/morpher";

interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export const MORPH_DURATION = 175;
const STAND_IN_RADIUS = "8px";

// The stand-in lives in the host document so it stays drawn while the dialog closes and the app beneath it changes.
export class BrowserMorpher implements Morpher {
  public morph(source: MorphSource, update: () => Element | undefined): void {
    const standIn = drawStandIn(source);

    if (standIn === undefined) {
      update();
      return;
    }
    const start = fitInside(source.getBoundingClientRect(), standIn);

    place(standIn, start);
    document.body.append(standIn);
    const target = update();

    if (target === undefined) {
      standIn.remove();
      return;
    }
    fly(standIn, start, target);
  }
}

function drawStandIn(source: MorphSource): HTMLCanvasElement | undefined {
  const { width, height } = measureIntrinsicSize(source);

  if (width === 0 || height === 0) {
    return undefined;
  }
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(source, 0, 0, width, height);
  return canvas;
}

function measureIntrinsicSize(source: MorphSource): { width: number; height: number } {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }

  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
}

function fitInside(box: Box, { width, height }: HTMLCanvasElement): Box {
  const scale = Math.min(box.width / width, box.height / height);
  const fitted = { width: width * scale, height: height * scale };
  return { left: box.left + ((box.width - fitted.width) / 2), top: box.top + ((box.height - fitted.height) / 2), ...fitted };
}

// Reads the target's box every frame, so the stand-in still lands on it when the page scrolls mid-flight.
function fly(standIn: HTMLCanvasElement, start: Box, target: Element): void {
  let startTime: number | undefined;
  const step = (time: number): void => {
    if (!target.isConnected) {
      standIn.remove();
      return;
    }
    startTime ??= time;
    const progress = Math.min((time - startTime) / MORPH_DURATION, 1);

    place(standIn, interpolate(start, target.getBoundingClientRect(), easeOut(progress)));    requestAnimationFrame(progress < 1 ? step : (): void => standIn.remove());
  };

  requestAnimationFrame(step);
}

function easeOut(progress: number): number {
  return 1 - ((1 - progress) ** 3);
}

function interpolate(from: Box, to: Box, amount: number): Box {
  const between = (a: number, b: number): number => a + ((b - a) * amount);
  return {
    left: between(from.left, to.left),
    top: between(from.top, to.top),
    width: between(from.width, to.width),
    height: between(from.height, to.height)
  };
}

function place(standIn: HTMLElement, box: Box): void {
  const properties: Record<string, string> = {
    "position": "fixed",
    "left": `${box.left}px`,
    "top": `${box.top}px`,
    "width": `${box.width}px`,
    "height": `${box.height}px`,
    "margin": "0",
    "border-radius": STAND_IN_RADIUS,
    "object-fit": "cover",
    "pointer-events": "none",
    "z-index": "2147483647"
  };

  for (const [property, value] of Object.entries(properties)) {
    standIn.style.setProperty(property, value);
  }
}
