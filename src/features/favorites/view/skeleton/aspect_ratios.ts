import { getAllContentThumbs, waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";
import { Storage } from "@/lib/storage/local_storage";
import { getImageFromThumb } from "@/lib/thumb/query";

const LOCAL_STORAGE_KEY = "aspectRatios";
const knownAspectRatios: string[] = Storage.get<string[]>(LOCAL_STORAGE_KEY) ?? [];

export async function collectAspectRatios(): Promise<void> {
  await waitForAllThumbsToLoad();
  const images = getAllContentThumbs()
    .map(thumb => getImageFromThumb(thumb))
    .filter(image => image !== null)
    .slice(0, 50);
  const newAspectRatios = images.map(image => aspectRatio(image.naturalWidth, image.naturalHeight));

  Storage.set(LOCAL_STORAGE_KEY, newAspectRatios.reverse());
}

export function getNextAspectRatio(): string | undefined {
  return knownAspectRatios.pop();
}

function aspectRatio(width: number, height: number): string {
  return `${width}/${height}`;
}
