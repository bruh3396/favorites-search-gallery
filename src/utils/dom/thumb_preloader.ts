import { getImageFromThumb, waitForAllThumbnailsToLoad } from "./dom";
import { Favorite } from "../../types/interfaces/interfaces";
import { sleep } from "../misc/async";

export function preloadFavorites(favorites: Favorite[]): void {
  preloadThumbURLs(favorites.map(favorite => favorite.thumbURL));
}

export function preloadThumbs(thumbs: HTMLElement[]): void {
  const images = thumbs.map(thumb => getImageFromThumb(thumb)).filter(image => image instanceof HTMLImageElement);

  preloadThumbURLs(images.map(image => image.src));
}

async function preloadThumbURLs(urls: string[]): Promise<void> {
    await waitForAllThumbnailsToLoad();

  for (const url of urls) {
    await sleep(3);
    preloadImage(url);
  }
}

function preloadImage(url: string): void {
  const img = new Image();

  img.src = url;
}
