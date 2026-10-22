import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";

export interface VideoEndDependencies {
  readShownMedia: () => EventTarget | undefined;
  autoplay: Pick<LightboxAutoplay, "showNextAfterVideo">;
}

export function listenForVideoEnd(root: HTMLElement, { readShownMedia, autoplay }: VideoEndDependencies): void {
  root.addEventListener("ended", event => {
    if (event.target === readShownMedia()) {
      autoplay.showNextAfterVideo();
    }
  }, true);
}
