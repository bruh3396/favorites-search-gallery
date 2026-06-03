import { PostOverlayClass } from "../types/css_names";

export function isInsideOverlay(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest(`.${PostOverlayClass.overlay}`) !== null;
}