import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";

export interface VideoEndDependencies {
  readShownMedia: () => EventTarget | undefined;
  autoplay: Pick<LightboxAutoplay, "showNextAfterVideo">;
}

// Media events don't bubble, so only a capturing listener hears the video end.
export function listenForVideoEnd(root: HTMLElement, { readShownMedia, autoplay }: VideoEndDependencies): void {
  root.addEventListener("ended", event => {
    if (event.target === readShownMedia()) {
      autoplay.showNextAfterVideo();
    }
  }, true);
}
