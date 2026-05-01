export function imageIsLoaded(image: HTMLImageElement): boolean {
  return image.complete || image.naturalWidth !== 0;
}

export function imageIsLoading(image: HTMLImageElement): boolean {
  return !imageIsLoaded(image);
}

export function preloadImage(url: string): void {
  const img = new Image();

  img.src = url;
}
