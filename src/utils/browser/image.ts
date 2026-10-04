export function isImageLoaded(image: HTMLImageElement): boolean {
  return image.complete || image.naturalWidth !== 0;
}

export function isImageLoading(image: HTMLImageElement): boolean {
  return !isImageLoaded(image);
}

export function preloadImage(url: string): void {
  new Image().src = url;
}

export async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = (): void => resolve();
    image.onerror = (): void => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
  return createImageBitmap(image);
}

export function createObjectUrlFromSvg(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}
