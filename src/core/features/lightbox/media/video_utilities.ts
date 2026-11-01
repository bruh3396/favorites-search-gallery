export function playVideo(video: HTMLVideoElement): void {
  video.play().catch((error: unknown) => {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.error(error);
    }
  });
}
