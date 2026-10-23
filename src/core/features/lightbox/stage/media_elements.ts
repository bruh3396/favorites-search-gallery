export function createLightboxImage(ownerDocument: Document, bitmap: ImageBitmap): HTMLCanvasElement {
  const canvas = ownerDocument.createElement("canvas");

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  return canvas;
}

export function createLightboxVideo(ownerDocument: Document): HTMLVideoElement {
  const video = ownerDocument.createElement("video");

  video.controls = true;
  video.loop = true;
  video.preload = "auto";
  video.setAttribute("controlsList", "nofullscreen");
  return video;
}

export function playVideo(video: HTMLVideoElement): void {
  video.play().catch((error: unknown) => {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.error(error);
    }
  });
}
