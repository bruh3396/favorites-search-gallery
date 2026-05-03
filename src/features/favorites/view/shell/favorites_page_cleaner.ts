import { sleep } from "../../../../lib/core/scheduling/promise";
import { waitForDOMToLoad } from "../../../../lib/ui/dom";

function getOriginalFavoritesContent(): HTMLElement | null {
  return document.querySelector("#content, div:has(.thumb)");
}

function removeNativeFavorites(): void {
  getOriginalFavoritesContent()?.remove();
}

function removeUnusedScripts(): void {
  for (const script of document.querySelectorAll("script")) {
    if ((/(?:fluidplayer|awesomplete)/).test(script.src ?? "")) {
      script.remove();
    }
  }
}

export async function cleanNativeFavoritesPage(): Promise<void> {
  await waitForDOMToLoad();
  await sleep(20);
  removeNativeFavorites();
  removeUnusedScripts();
}
