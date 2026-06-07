import { PostOverlayClass } from "@/features/post_overlay/types/scaffold";

export function isInsideOverlay(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest(`.${PostOverlayClass.overlay}`) !== null;
}
