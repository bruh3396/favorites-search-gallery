export function loadImage(url: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = (): void => {
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };
    const onLoad = (): void => {
      cleanup();
      resolve(image);
    };
    const onError = (): void => {
      cleanup();
      reject(new Error(`Could not load image: ${url}`));
    };
    const onAbort = (): void => {
      cleanup();
      image.removeAttribute("src");
      reject(new DOMException("Image load aborted", "AbortError"));
    };

    if (signal?.aborted === true) {
      onAbort();
      return;
    }
    image.addEventListener("load", onLoad, { once: true });
    image.addEventListener("error", onError, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
    image.src = url;
  });
}

export function decodeBitmap(source: ImageBitmapSource): Promise<ImageBitmap> {
  return createImageBitmap(source);
}
