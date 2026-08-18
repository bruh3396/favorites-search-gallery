export function imageIsLoaded(image: HTMLImageElement): boolean {
  return image.complete || image.naturalWidth !== 0;
}

export function imageIsLoading(image: HTMLImageElement): boolean {
  return !imageIsLoaded(image);
}

export function preloadImage(url: string): void {
  new Image().src = url;
}

export function createObjectUrlFromSvg(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}
