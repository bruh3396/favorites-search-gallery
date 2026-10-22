import { MorphSource, Morpher } from "@/core/boundary/ports/morpher/morpher";

interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

interface Size {
  readonly width: number;
  readonly height: number;
}

interface Frame {
  readonly box: Box;
  readonly bounds?: Box;
}

export const MORPH_DURATION = 250;
const STAND_IN_RADIUS = 8;

export class BrowserMorpher implements Morpher {
  public morph(source: MorphSource, update: () => Element | undefined): void {
    const intrinsic = measureIntrinsicSize(source);
    const start = fitInside(source.getBoundingClientRect(), intrinsic);

    if (isEmpty(intrinsic) || isEmpty(start)) {
      update();
      return;
    }
    const standIn = drawStandIn(source, start, intrinsic);

    document.body.append(standIn);
    const target = update();

    if (target === undefined) {
      standIn.remove();
      return;
    }
    fly(standIn, start, target);
  }
}

function isEmpty({ width, height }: Size): boolean {
  return !(width > 0 && height > 0);
}

function drawStandIn(source: MorphSource, start: Box, intrinsic: Size): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const density = Math.min(window.devicePixelRatio, intrinsic.width / start.width);

  canvas.width = Math.max(1, Math.round(start.width * density));
  canvas.height = Math.max(1, Math.round(start.height * density));
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  pin(canvas, start);
  cover(canvas, start, { box: start });
  return canvas;
}

function measureIntrinsicSize(source: MorphSource): Size {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }

  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
}

function fitInside(box: Box, { width, height }: Size): Box {
  const scale = Math.min(box.width / width, box.height / height);
  const fitted = { width: width * scale, height: height * scale };
  return { left: box.left + ((box.width - fitted.width) / 2), top: box.top + ((box.height - fitted.height) / 2), ...fitted };
}

function fly(standIn: HTMLCanvasElement, start: Box, target: Element): void {
  const reveal = hide(target);
  const viewport = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  const destination = findClippingAncestor(target)?.getBoundingClientRect();
  const land = (): void => {
    standIn.remove();
    reveal();
  };
  let startTime: number | undefined;
  const step = (time: number): void => {
    if (!target.isConnected) {
      land();
      return;
    }
    startTime ??= time;
    const progress = Math.min((time - startTime) / MORPH_DURATION, 1);
    const amount = easeOut(progress);
    const bounds = destination === undefined ? undefined : interpolate(viewport, destination, amount);

    cover(standIn, start, { box: interpolate(start, target.getBoundingClientRect(), amount), bounds });
    requestAnimationFrame(progress < 1 ? step : land);
  };

  requestAnimationFrame(step);
}

function findClippingAncestor(element: Element): Element | undefined {
  for (let ancestor = element.parentElement; ancestor !== null && ancestor !== document.body; ancestor = ancestor.parentElement) {
    if (getComputedStyle(ancestor).overflow !== "visible") {
      return ancestor;
    }
  }
  return undefined;
}

function hide(element: Element): () => void {
  if (!(element instanceof HTMLElement)) {
    return () => undefined;
  }
  const { style } = element;
  const visibility = style.getPropertyValue("visibility");
  const priority = style.getPropertyPriority("visibility");

  style.setProperty("visibility", "hidden");
  return () => style.setProperty("visibility", visibility, priority);
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

function pin(standIn: HTMLElement, start: Box): void {
  const properties: Record<string, string> = {
    "position": "fixed",
    "left": `${start.left}px`,
    "top": `${start.top}px`,
    "width": `${start.width}px`,
    "height": `${start.height}px`,
    "margin": "0",
    "transform-origin": "0 0",
    "will-change": "transform, clip-path",
    "pointer-events": "none",
    "z-index": "2147483647"
  };

  for (const [property, value] of Object.entries(properties)) {
    standIn.style.setProperty(property, value);
  }
}

function cover(standIn: HTMLElement, start: Box, { box, bounds }: Frame): void {
  const scale = Math.max(box.width / start.width, box.height / start.height);
  const insetX = (start.width - (box.width / scale)) / 2;
  const insetY = (start.height - (box.height / scale)) / 2;
  const translateX = box.left - start.left - (insetX * scale);
  const translateY = box.top - start.top - (insetY * scale);
  const local = bounds === undefined ? { left: 0, top: 0, width: start.width, height: start.height } : {
    left: (bounds.left - start.left - translateX) / scale,
    top: (bounds.top - start.top - translateY) / scale,
    width: bounds.width / scale,
    height: bounds.height / scale
  };
  const top = Math.max(insetY, local.top);
  const right = Math.max(insetX, start.width - local.left - local.width);
  const bottom = Math.max(insetY, start.height - local.top - local.height);
  const left = Math.max(insetX, local.left);

  standIn.style.setProperty("transform", `translate(${translateX}px, ${translateY}px) scale(${scale})`);
  standIn.style.setProperty("clip-path", `inset(${top}px ${right}px ${bottom}px ${left}px round ${STAND_IN_RADIUS / scale}px)`);
}
