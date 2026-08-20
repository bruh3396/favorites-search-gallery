export function isImageLoaded(image: HTMLImageElement): boolean {
  return image.complete || image.naturalWidth !== 0;
}

export function isImageLoading(image: HTMLImageElement): boolean {
  return !isImageLoaded(image);
}

export function preloadImage(url: string): void {
  new Image().src = url;
}

export function createObjectUrlFromSvg(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}
