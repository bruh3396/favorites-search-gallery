import { removeDataset, setDataset } from "@/utils/browser/dataset";
import { ThumbConfig } from "@/config/thumb_config";
import { getImageFromThumb } from "@/lib/ui/thumb/query";

export class Fader {
  private readonly observer = new IntersectionObserver(entries => this.fadeInOnScreen(entries), { root: null, threshold: 0 });
  private readonly pending: Map<HTMLElement, () => void> = new Map();
  private readonly fadeThumbs: boolean;
  private readonly getColumnCount: () => number;

  constructor(root: HTMLElement, fadeThumbs: boolean, getColumnCount: () => number) {
    this.fadeThumbs = fadeThumbs;
    this.getColumnCount = getColumnCount;
    root.style.setProperty("--fade-cascade-step", `${ThumbConfig.fadeCascadeStepMs}ms`);
  }

  public fadeInReplacement(thumbs: HTMLElement[], insert: () => void): void {
    this.stopFadeIn();
    this.fadeIn(thumbs, insert);
  }

  public fadeIn(thumbs: HTMLElement[], insert: () => void): void {
    if (this.fadeThumbs) {
      thumbs.forEach(thumb => setDataset(thumb, "fading"));
      insert();
      thumbs.forEach(thumb => this.observe(thumb));
    } else {
      thumbs.forEach(thumb => removeDataset(thumb, "fading"));
      insert();
    }
  }

  public clearFade(thumbs: HTMLElement[]): void {
    this.stopFadeIn();
    thumbs.forEach(thumb => removeDataset(thumb, "fading"));
  }

  private stopFadeIn(): void {
    this.observer.disconnect();

    for (const [thumb, cancel] of this.pending) {
      cancel();
      removeDataset(thumb, "fading");
    }
    this.pending.clear();
  }

  private observe(thumb: HTMLElement): void {
    this.pending.set(thumb, () => this.observer.unobserve(thumb));
    this.observer.observe(thumb);
  }

  private fadeInOnScreen(entries: IntersectionObserverEntry[]): void {
    const columnCount = Math.max(1, this.getColumnCount());
    let cascadeIndex = 0;

    for (const entry of entries) {
      if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
        continue;
      }
      const thumb = entry.target;

      this.observer.unobserve(thumb);
      thumb.style.setProperty("--fade-cascade-index", String(Math.floor(cascadeIndex / columnCount)));
      this.fadeInWhenImageReady(thumb);
      cascadeIndex += 1;
    }
  }

  private fadeInWhenImageReady(thumb: HTMLElement): void {
    const image = getImageFromThumb(thumb);

    if (image === null || image.complete) {
      this.startFade(thumb);
      return;
    }
    const onImageReady = (): void => {
      image.removeEventListener("load", onImageReady);
      image.removeEventListener("error", onImageReady);
      this.startFade(thumb);
    };

    this.pending.set(thumb, () => {
      image.removeEventListener("load", onImageReady);
      image.removeEventListener("error", onImageReady);
    });
    image.addEventListener("load", onImageReady);
    image.addEventListener("error", onImageReady);
  }

  private startFade(thumb: HTMLElement): void {
    const onAnimationEnd = (): void => {
      this.pending.delete(thumb);
      removeDataset(thumb, "fading");
    };

    this.pending.set(thumb, () => thumb.removeEventListener("animationend", onAnimationEnd));
    setDataset(thumb, "fading", "play");
    thumb.addEventListener("animationend", onAnimationEnd, { once: true });
  }
}
