import { getAllThumbs, getImageFromThumb, waitForAllThumbnailsToLoad } from "../../../../utils/dom/dom";

const LOCAL_STORAGE_KEY = "aspectRatios";
const ASPECT_RATIOS: string[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");

function getAspectRatio(width: number, height: number): string {
  return `${width}/${height}`;
}

export async function collectAspectRatios(): Promise<void> {
  await waitForAllThumbnailsToLoad();
  const thumbs = getAllThumbs();
  const images = thumbs.map(thumb => getImageFromThumb(thumb)).filter(image => image !== null).slice(0, 50);
  const sizes = images.map(image => getAspectRatio(image.naturalWidth, image.naturalHeight));

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sizes.reverse()));
}

export function getNextAspectRatio(): string | undefined {
  return ASPECT_RATIOS.pop();
}
