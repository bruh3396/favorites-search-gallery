import { sleep } from "../../../../lib/async/sleep";
import { waitForDomToLoad } from "../../../../app/input/dom_events";

export async function cleanNativeFavoritesPage(): Promise<void> {
  await waitForDomToLoad();
  await sleep(20);
  removeNativeFavorites();
  removeUnusedScripts();
}

function removeNativeFavorites(): void {
  extractNativeFavorites()?.remove();
}

function extractNativeFavorites(): HTMLElement | null {
  return document.querySelector("#content, div:has(.thumb)");
}

function removeUnusedScripts(): void {
  for (const script of document.querySelectorAll("script")) {
    if ((/(?:fluidplayer|awesomplete)/).test(script.src ?? "")) {
      script.remove();
    }
  }
}
