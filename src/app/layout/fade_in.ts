import { removeDataset, setDataset } from "@/utils/dom/dataset";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { ThumbConfig } from "@/config/thumb_config";
import { getImageFromThumb } from "@/lib/thumb/thumbs";

const observer = new IntersectionObserver(fadeInOnScreen, { root: null, threshold: 0 });
const pending = new Map<HTMLElement, () => void>();

export function setupFadeIn(): void {
  document.documentElement.style.setProperty("--fade-cascade-step", `${ThumbConfig.fadeCascadeStepMs}ms`);
}

export function fadeInReplacement(thumbs: HTMLElement[], insert: () => void): void {
  stopFadeIn();
  fadeIn(thumbs, insert);
}

export function fadeIn(thumbs: HTMLElement[], insert: () => void): void {
  if (Preferences.app.fadeThumbs.value) {
    thumbs.forEach(thumb => setDataset(thumb, "fading"));
    insert();
    thumbs.forEach(observe);
  } else {
    thumbs.forEach(thumb => removeDataset(thumb, "fading"));
    insert();
  }
}

export function clearFade(thumbs: HTMLElement[]): void {
  stopFadeIn();
  thumbs.forEach(thumb => removeDataset(thumb, "fading"));
}

function stopFadeIn(): void {
  observer.disconnect();

  for (const [thumb, cancel] of pending) {
    cancel();
    removeDataset(thumb, "fading");
  }
  pending.clear();
}

function observe(thumb: HTMLElement): void {
  pending.set(thumb, () => observer.unobserve(thumb));
  observer.observe(thumb);
}

function fadeInOnScreen(entries: IntersectionObserverEntry[]): void {
  const columnCount = Math.max(1, ON_FAVORITES_PAGE ? Preferences.favorites.columnCount.value : Preferences.postList.columnCount.value);
  let cascadeIndex = 0;

  for (const entry of entries) {
    if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
      continue;
    }
    const thumb = entry.target;

    observer.unobserve(thumb);
    thumb.style.setProperty("--fade-cascade-index", String(Math.floor(cascadeIndex / columnCount)));
    fadeInWhenImageReady(thumb);
    cascadeIndex += 1;
  }
}

function fadeInWhenImageReady(thumb: HTMLElement): void {
  const image = getImageFromThumb(thumb);

  if (image === null || image.complete) {
    startFade(thumb);
    return;
  }
  const onImageReady = (): void => {
    image.removeEventListener("load", onImageReady);
    image.removeEventListener("error", onImageReady);
    startFade(thumb);
  };

  pending.set(thumb, () => {
    image.removeEventListener("load", onImageReady);
    image.removeEventListener("error", onImageReady);
  });
  image.addEventListener("load", onImageReady);
  image.addEventListener("error", onImageReady);
}

function startFade(thumb: HTMLElement): void {
  const onAnimationEnd = (): void => {
    pending.delete(thumb);
    removeDataset(thumb, "fading");
  };

  pending.set(thumb, () => thumb.removeEventListener("animationend", onAnimationEnd));
  setDataset(thumb, "fading", "play");
  thumb.addEventListener("animationend", onAnimationEnd, { once: true });
}
