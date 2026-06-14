import { removeDataset, setDataset } from "@/utils/dom/attribute";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { ThumbConfig } from "@/config/thumb_config";
import { getImageFromThumb } from "@/lib/thumb/thumbs";

const fadeObserver = new IntersectionObserver(fadeInOnScreen, { root: null, threshold: 0 });

export function setupFadeIn(): void {
  document.documentElement.style.setProperty("--fade-cascade-step", `${ThumbConfig.fadeCascadeStepMs}ms`);
}

export function fadeInReplacement(thumbs: HTMLElement[], insert: () => void): void {
  stopObservingAll();
  fadeIn(thumbs, insert);
}

export function fadeIn(thumbs: HTMLElement[], insert: () => void): void {
  if (ThumbConfig.fadeIn) {
    thumbs.forEach(thumb => setDataset(thumb, "fading"));
    insert();
    thumbs.forEach(thumb => fadeObserver.observe(thumb));
  } else {
    insert();
  }
}

function stopObservingAll(): void {
  fadeObserver.disconnect();
}

function fadeInOnScreen(entries: IntersectionObserverEntry[]): void {
  const columnCount = Math.max(1, ON_FAVORITES_PAGE ? Preferences.favorites.columnCount.value : Preferences.postList.columnCount.value);
  let cascadeIndex = 0;

  for (const entry of entries) {
    if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
      continue;
    }
    const thumb = entry.target;

    fadeObserver.unobserve(thumb);
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

  image.addEventListener("load", onImageReady);
  image.addEventListener("error", onImageReady);
}

function startFade(thumb: HTMLElement): void {
  setDataset(thumb, "fading", "play");
  thumb.addEventListener("animationend", () => removeDataset(thumb, "fading"), { once: true });
}
