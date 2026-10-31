import { LightboxMediaElement } from "@/core/features/lightbox/stage/lightbox_media_element";
import { Size } from "@/core/utils/geometry/size";

interface Box extends Size {
  readonly left: number;
  readonly top: number;
}

interface Frame {
  readonly box: Box;
  readonly boundsBox?: Box;
}

const STAND_IN_RADIUS = 8;

export function morphLightboxMedia(sourceLightboxMediaElement: LightboxMediaElement, duration: number, update: () => Element | undefined): void {
  const view = sourceLightboxMediaElement.ownerDocument.defaultView;
  const intrinsicSize = measureIntrinsicSize(sourceLightboxMediaElement);
  const startBox = fitInside(sourceLightboxMediaElement.getBoundingClientRect(), intrinsicSize);

  if (view === null || isEmpty(intrinsicSize) || isEmpty(startBox)) {
    update();
    return;
  }
  const standIn = drawStandIn(view, sourceLightboxMediaElement, { startBox, intrinsicSize });

  sourceLightboxMediaElement.ownerDocument.body.append(standIn);
  const target = update();

  if (target === undefined) {
    standIn.remove();
    return;
  }
  fly(view, standIn, { startBox, target, duration });
}

function isEmpty({ width, height }: Size): boolean {
  return !(width > 0 && height > 0);
}

function drawStandIn(view: Window, sourceLightboxMediaElement: LightboxMediaElement, { startBox, intrinsicSize }: { startBox: Box; intrinsicSize: Size }): HTMLCanvasElement {
  const canvas = sourceLightboxMediaElement.ownerDocument.createElement("canvas");
  const density = Math.min(view.devicePixelRatio, intrinsicSize.width / startBox.width);

  canvas.width = Math.max(1, Math.round(startBox.width * density));
  canvas.height = Math.max(1, Math.round(startBox.height * density));
  canvas.getContext("2d")?.drawImage(sourceLightboxMediaElement, 0, 0, canvas.width, canvas.height);
  pin(canvas, startBox);
  cover(canvas, startBox, { box: startBox });
  return canvas;
}

function measureIntrinsicSize(sourceLightboxMediaElement: LightboxMediaElement): Size {
  if (sourceLightboxMediaElement instanceof HTMLVideoElement) {
    return { width: sourceLightboxMediaElement.videoWidth, height: sourceLightboxMediaElement.videoHeight };
  }

  if (sourceLightboxMediaElement instanceof HTMLImageElement) {
    return { width: sourceLightboxMediaElement.naturalWidth, height: sourceLightboxMediaElement.naturalHeight };
  }
  return { width: sourceLightboxMediaElement.width, height: sourceLightboxMediaElement.height };
}

function fitInside(box: Box, { width, height }: Size): Box {
  const scale = Math.min(box.width / width, box.height / height);
  const fitted = { width: width * scale, height: height * scale };
  return { left: box.left + ((box.width - fitted.width) / 2), top: box.top + ((box.height - fitted.height) / 2), ...fitted };
}

function fly(view: Window, standIn: HTMLCanvasElement, { startBox, target, duration }: { startBox: Box; target: Element; duration: number }): void {
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
    const box = destination === undefined ? undefined : interpolate(viewport, destination, amount);

    cover(standIn, startBox, { box: interpolate(startBox, target.getBoundingClientRect(), amount), boundsBox: box });
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

function interpolate(fromBox: Box, toBox: Box, amount: number): Box {
  const between = (a: number, b: number): number => a + ((b - a) * amount);
  return {
    left: between(fromBox.left, toBox.left),
    top: between(fromBox.top, toBox.top),
    width: between(fromBox.width, toBox.width),
    height: between(fromBox.height, toBox.height)
  };
}

function pin(standIn: HTMLElement, startBox: Box): void {
  const properties: Record<string, string> = {
    "position": "fixed",
    "left": `${startBox.left}px`,
    "top": `${startBox.top}px`,
    "width": `${startBox.width}px`,
    "height": `${startBox.height}px`,
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

function cover(standIn: HTMLElement, startBox: Box, { box, boundsBox }: Frame): void {
  const scale = Math.max(box.width / startBox.width, box.height / startBox.height);
  const insetX = (startBox.width - (box.width / scale)) / 2;
  const insetY = (startBox.height - (box.height / scale)) / 2;
  const translateX = box.left - startBox.left - (insetX * scale);
  const translateY = box.top - startBox.top - (insetY * scale);
  const local = boundsBox === undefined ? { left: 0, top: 0, width: startBox.width, height: startBox.height } : {
    left: (boundsBox.left - startBox.left - translateX) / scale,
    top: (boundsBox.top - startBox.top - translateY) / scale,
    width: boundsBox.width / scale,
    height: boundsBox.height / scale
  };
  const top = Math.max(insetY, local.top);
  const right = Math.max(insetX, startBox.width - local.left - local.width);
  const bottom = Math.max(insetY, startBox.height - local.top - local.height);
  const left = Math.max(insetX, local.left);

  standIn.style.setProperty("transform", `translate(${translateX}px, ${translateY}px) scale(${scale})`);
  standIn.style.setProperty("clip-path", `inset(${top}px ${right}px ${bottom}px ${left}px round ${STAND_IN_RADIUS / scale}px)`);
}
