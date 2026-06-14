import { removeDataset, setDataset } from "@/utils/dom/attribute";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { ThumbConfig } from "@/config/thumb_config";

const fadeObserver = new IntersectionObserver(revealVisible, { root: null, threshold: 0 });

export function setupFadeIn(): void {
  document.documentElement.style.setProperty("--fade-cascade-step", `${ThumbConfig.fadeCascadeStepMs}ms`);
}

export function fadeInFresh(items: HTMLElement[], action: () => void): void {
  resetFadeObserver();
  fadeIn(items, action);
}

export function fadeIn(items: HTMLElement[], action: () => void): void {
  if (ThumbConfig.fadeIn) {
    items.forEach(item => setDataset(item, "fading"));
    action();
    items.forEach(item => fadeObserver.observe(item));
  } else {
    action();
  }
}

function resetFadeObserver(): void {
  fadeObserver.disconnect();
}

function revealVisible(entries: IntersectionObserverEntry[]): void {
  const columnCount = Math.max(1, ON_FAVORITES_PAGE ? Preferences.favorites.columnCount.value : Preferences.postList.columnCount.value);
  let revealed = 0;

  for (const entry of entries) {
    if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
      continue;
    }
    const item = entry.target;

    fadeObserver.unobserve(item);
    item.style.setProperty("--fade-cascade-index", String(Math.floor(revealed / columnCount)));
    setDataset(item, "fading", "play");
    item.addEventListener("animationend", () => removeDataset(item, "fading"), { once: true });
    revealed += 1;
  }
}
