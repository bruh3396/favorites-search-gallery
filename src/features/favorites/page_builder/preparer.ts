import {sleep} from "../../../utils/misc/generic";
import {waitForDOMToLoad} from "../../../utils/dom/dom";

function getOriginalFavoritesContent(): HTMLElement | null {
  return document.querySelector("#content, div:has(.thumb)");
}

function clearOriginalFavoritesContent(): void {
  getOriginalFavoritesContent()?.remove();
}

function removeUnusedFavoritesPageScripts(): void {
  for (const script of document.querySelectorAll("script")) {
    if ((/(?:fluidplayer|awesomplete)/).test(script.src || "")) {
      script.remove();
    }
  }
}

export async function cleanOriginalFavoritesPage(): Promise<void> {
  await waitForDOMToLoad();
  await sleep(20);
  clearOriginalFavoritesContent();
  removeUnusedFavoritesPageScripts();
}
