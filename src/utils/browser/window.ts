import { readQueryParam as readQueryParamFromUrl } from "@/utils/pure/url";

export function toggleFullscreen(): void {
  if (document.fullscreenElement === null) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

export function reloadWindow(): void {
  window.location.reload();
}

export function blurActiveElement(): void {
  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}

export function readQueryParam(name: string): string | null {
  return readQueryParamFromUrl(window.location.href, name);
}
