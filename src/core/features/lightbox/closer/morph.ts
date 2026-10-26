import { Size } from "@/core/utils/geometry/size";

export type MorphSource = Readonly<HTMLImageElement | HTMLCanvasElement | HTMLVideoElement>;

interface Box extends Size {
  readonly left: number;
  readonly top: number;
}

interface Frame {
  readonly box: Box;
  readonly bounds?: Box;
}

const STAND_IN_RADIUS = 8;

export function morph(source: MorphSource, duration: number, update: () => Element | undefined): void {
  const view = source.ownerDocument.defaultView;
  const intrinsic = measureIntrinsicSize(source);
  const start = fitInside(source.getBoundingClientRect(), intrinsic);

  if (view === null || isEmpty(intrinsic) || isEmpty(start)) {
    update();
    return;
  }
  const standIn = drawStandIn(view, source, { start, intrinsic });

  source.ownerDocument.body.append(standIn);
  const target = update();

  if (target === undefined) {
    standIn.remove();
    return;
  }
  fly(view, standIn, { start, target, duration });
}

function isEmpty({ width, height }: Size): boolean {
  return !(width > 0 && height > 0);
}

function drawStandIn(view: Window, source: MorphSource, { start, intrinsic }: { start: Box; intrinsic: Size }): HTMLCanvasElement {
  const canvas = source.ownerDocument.createElement("canvas");
  const density = Math.min(view.devicePixelRatio, intrinsic.width / start.width);

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

function fly(view: Window, standIn: HTMLCanvasElement, { start, target, duration }: { start: Box; target: Element; duration: number }): void {
  const reveal = hide(target);
  const viewport = { left: 0, top: 0, width: view.innerWidth, height: view.innerHeight };
  const destination = findClippingAncestor(view, target)?.getBoundingClientRect();
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
    const progress = Math.min((time - startTime) / duration, 1);
    const amount = easeOut(progress);
    const bounds = destination === undefined ? undefined : interpolate(viewport, destination, amount);

    cover(standIn, start, { box: interpolate(start, target.getBoundingClientRect(), amount), bounds });
    view.requestAnimationFrame(progress < 1 ? step : land);
  };

  view.requestAnimationFrame(step);
}

function findClippingAncestor(view: Window, element: Element): Element | undefined {
  for (let ancestor = element.parentElement; ancestor !== null && ancestor !== element.ownerDocument.body; ancestor = ancestor.parentElement) {
    if (view.getComputedStyle(ancestor).overflow !== "visible") {
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
