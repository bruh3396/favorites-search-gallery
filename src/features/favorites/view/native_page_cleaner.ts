import { ON_FIRST_FAVORITES_PAGE } from "@/lib/environment";

export function removeOriginalUnusedScripts(): void {
  for (const script of document.querySelectorAll("script")) {
    if ((/(?:fluidplayer|awesomplete)/).test(script.src)) {
      script.remove();
    }
  }
}

export function firstPageFavorites(): HTMLElement[] | undefined {
  return ON_FIRST_FAVORITES_PAGE ? takeNativeFavorites() : undefined;
}

function takeNativeFavorites(): HTMLElement[] | undefined {
  const content = document.querySelector<HTMLElement>("#content, div:has(.thumb)");

  if (content === null) {
    return undefined;
  }
  const thumbs = Array.from(content.querySelectorAll<HTMLElement>(".thumb"));

  content.remove();
  return thumbs.length === 0 ? undefined : thumbs;
}
