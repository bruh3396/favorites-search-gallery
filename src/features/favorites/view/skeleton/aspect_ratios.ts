import { Storage } from "@/lib/storage/local_storage";
import { getImageFromThumb } from "@/lib/ui/thumb/query";

const LOCAL_STORAGE_KEY = "aspectRatios";

export class FavoritesAspectRatios {
  private readonly knownAspectRatios: string[] = Storage.get<string[]>(LOCAL_STORAGE_KEY) ?? [];

  public collect(thumbs: HTMLElement[]): void {
    const images = thumbs
      .map(thumb => getImageFromThumb(thumb))
      .filter(image => image !== null)
      .slice(0, 50);
    const newAspectRatios = images.map(image => this.aspectRatio(image.naturalWidth, image.naturalHeight));

    Storage.set(LOCAL_STORAGE_KEY, newAspectRatios.reverse());
  }

  public getNext(): string | undefined {
    return this.knownAspectRatios.pop();
  }

  private aspectRatio(width: number, height: number): string {
    return `${width}/${height}`;
  }
}
