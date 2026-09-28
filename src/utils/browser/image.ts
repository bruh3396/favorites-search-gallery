export function isImageLoaded(image: HTMLImageElement): boolean {
  return image.complete || image.naturalWidth !== 0;
}

export function isImageLoading(image: HTMLImageElement): boolean {
  return !isImageLoaded(image);
}

export function preloadImage(url: string): void {
  new Image().src = url;
}

export async function loadImageBitmap(url: string, signal?: AbortSignal): Promise<ImageBitmap> {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    const abort = (): void => {
      image.removeAttribute("src");
      reject(new DOMException("Image load aborted", "AbortError"));
    };

    if (signal?.aborted === true) {
      abort();
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    image.onload = (): void => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    image.onerror = (): void => {
      signal?.removeEventListener("abort", abort);
      reject(new Error(`Failed to load image: ${url}`));
    };
    image.src = url;
  });
  return createImageBitmap(image);
}

export function createObjectUrlFromSvg(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}
