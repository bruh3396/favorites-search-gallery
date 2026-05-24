import { Content } from "../../../app/layout/shell";
import { Events } from "../../../app/channels/events";
import { FavoritesConfig } from "../../../config/favorites_config";
import { ON_MOBILE_DEVICE } from "../../../lib/environment/environment";
import { insertStyle } from "../../../lib/dom/injector";
import { yieldControl } from "../../../lib/async/timing";

export async function setup(): Promise<void> {
  if (ON_MOBILE_DEVICE || !FavoritesConfig.bottomNavigationButtonsEnabled) {
    return;
  }
  const container = document.createElement("div");
  const previousButton = document.createElement("button");
  const nextButton = document.createElement("button");

  container.id = "favorites-bottom-navigation-buttons";
  previousButton.id = "favorites-bottom-previous-button";
  nextButton.id = "favorites-bottom-next-button";
  previousButton.disabled = true;
  nextButton.disabled = true;
  previousButton.textContent = "Previous";
  nextButton.textContent = "Next";
  previousButton.title = "Previous page";
  nextButton.title = "Next page";

  previousButton.onclick = (): void => {
    Events.favorites.relativePageSelected.emit("previous");
  };

  nextButton.onclick = (): void => {
    Events.favorites.relativePageSelected.emit("next");
  };

  Events.favorites.pageChanged.on(() => {
    const previousMenuButton = document.getElementById("previous-page");
    const nextMenuButton = document.getElementById("next-page");

    if (!(previousMenuButton instanceof HTMLButtonElement) || !(nextMenuButton instanceof HTMLButtonElement)) {
      return;
    }
    previousButton.disabled = previousMenuButton.disabled;
    nextButton.disabled = nextMenuButton.disabled;
  });

  insertStyle(`
    body {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    #favorites-search-gallery {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  `);

  container.appendChild(previousButton);
  container.appendChild(nextButton);
  await yieldControl();
  Content.insertAdjacentElement("afterend", container);
}
