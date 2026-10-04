import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { getImageFromThumb } from "@/lib/ui/thumb/query";

const STORAGE_KEY = "aspectRatios";

export class FavoritesAspectRatios {
  private readonly store: LocalKeyedValues;
  private readonly knownAspectRatios: string[];

  constructor(store: LocalKeyedValues) {
    this.store = store;
    this.knownAspectRatios = this.readStored();
  }

  public collect(thumbs: HTMLElement[]): void {
    const images = thumbs
      .map(thumb => getImageFromThumb(thumb))
      .filter(image => image !== null)
      .slice(0, 50);
    const newAspectRatios = images.map(image => this.aspectRatio(image.naturalWidth, image.naturalHeight));

    this.store.set(STORAGE_KEY, newAspectRatios.reverse());
  }

  public getNext(): string | undefined {
    return this.knownAspectRatios.pop();
  }

  private aspectRatio(width: number, height: number): string {
    return `${width}/${height}`;
  }

  private readStored(): string[] {
    const stored = this.store.get(STORAGE_KEY);
    return Array.isArray(stored) ? stored.filter((entry): entry is string => typeof entry === "string") : [];
  }
}
