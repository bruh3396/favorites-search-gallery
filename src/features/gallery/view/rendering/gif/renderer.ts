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
  hide,
  cache: GalleryConfig.gifPreloadingEnabled ? cacheGifs : doNothing,
  clearCache: doNothing
} satisfies GalleryRenderer;

function render(thumb: HTMLElement): void {
  root.style.visibility = "visible";
  gif.src = "";
  gif.src = gifUrl(thumb);
}

function hide(): void {
  root.style.visibility = "hidden";
  gif.src = "";
}

function cacheGifs(thumbs: HTMLElement[]): void {
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
