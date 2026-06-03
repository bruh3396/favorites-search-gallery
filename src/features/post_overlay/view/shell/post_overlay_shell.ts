import POST_OVERLAY_CSS from "../../../../assets/css/post_overlay.css";
import { insertStyle } from "../../../../utils/dom/injector";

let overlay: HTMLElement | null = null;

export function setup(): void {
  insertStyle(POST_OVERLAY_CSS, "post-overlay");
  overlay = document.createElement("div");
  overlay.className = "post-overlay";
  document.body.appendChild(overlay);
}

export function getOverlay(): HTMLElement {
  if (overlay === null) {
    throw new Error("post overlay pool not set up");
  }
  return overlay;
}
