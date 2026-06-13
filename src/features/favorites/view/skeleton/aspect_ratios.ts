import { getAllContentThumbs, waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";
import { Storage } from "@/lib/storage/local_storage";
import { getImageFromThumb } from "@/lib/thumb/thumbs";

const LOCAL_STORAGE_KEY = "aspectRatios";
const aspectRatios: string[] = Storage.get<string[]>(LOCAL_STORAGE_KEY) ?? [];

export async function collectAspectRatios(): Promise<void> {
  await waitForAllThumbsToLoad();
  const thumbs = getAllContentThumbs();
  const images = thumbs.map(thumb => getImageFromThumb(thumb)).filter(image => image !== null).slice(0, 50);
  const sizes = images.map(image => getAspectRatio(image.naturalWidth, image.naturalHeight));

  Storage.set(LOCAL_STORAGE_KEY, sizes.reverse());
}

export function getNextAspectRatio(): string | undefined {
  return aspectRatios.pop();
}

function getAspectRatio(width: number, height: number): string {
  return `${width}/${height}`;
}
