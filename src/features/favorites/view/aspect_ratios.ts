import {getAllThumbs, getImageFromThumb, waitForAllThumbnailsToLoad} from "../../../utils/dom/dom";
import {Events} from "../../../lib/functional/events";
const LOCAL_STORAGE_KEY = "aspectRatios";
let aspectRatios: string[] = [];

function loadAspectRatios(): void {
  aspectRatios = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
}

function saveAspectRatios(): void {
  Events.favorites.favoritesLoaded.on(async() => {
    await waitForAllThumbnailsToLoad();
    const thumbs = getAllThumbs();
    const images = thumbs.map(thumb => getImageFromThumb(thumb)).filter(image => image !== null).slice(0, 50);
    const sizes = images.map(image => getAspectRatio(image.naturalWidth, image.naturalHeight));

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sizes.reverse()));
  }, {once: true});
}

function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
}

export function collectAspectRatios(): void {
  loadAspectRatios();
  saveAspectRatios();
}

export function getNextAspectRatio(): string | undefined {
  return aspectRatios.pop();
}
