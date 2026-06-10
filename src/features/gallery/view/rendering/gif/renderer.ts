import { GalleryConfig } from "@/config/gallery_config";
import { GalleryRenderer } from "@/features/gallery/types/gallery_types";
import { doNothing } from "@/utils/function";
import { gifUrl } from "@/lib/thumb/url";
import { isGif } from "@/lib/media/type_predicates";

const root = document.createElement("div");
const gif = document.createElement("img");
const preloadedGifs: HTMLImageElement[] = [];

root.id = "gif-container";
root.className = "gallery-image-frame";
gif.className = "gallery-image";
root.appendChild(gif);

export const GalleryGifRenderer = {
  root,
  render,
  clear,
  preload: GalleryConfig.gifPreloadingEnabled ? preloadGifs : doNothing,
  reset: doNothing,
  softReset: doNothing
} satisfies GalleryRenderer;

function render(thumb: HTMLElement): void {
  root.style.visibility = "visible";
  gif.src = "";
  gif.src = gifUrl(thumb);
}

function clear(): void {
  root.style.visibility = "hidden";
  gif.src = "";
}

function preloadGifs(thumbs: HTMLElement[]): void {
  const gifSources = thumbs
    .filter((thumb) => isGif(thumb))
    .slice(0, GalleryConfig.preloadedGifCount)
    .map((thumb) => gifUrl(thumb));

  for (const source of gifSources) {
    const preloadedGif = new Image();

    preloadedGif.src = source;
    preloadedGifs.push(preloadedGif);
  }
}
