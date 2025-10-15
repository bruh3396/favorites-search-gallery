import { CONTENT_CONTAINER } from "../../../../../lib/global/content_container";
import { Events } from "../../../../../lib/global/events/events";
import { FavoritesSettings } from "../../../../../config/favorites_settings";
import { ON_MOBILE_DEVICE } from "../../../../../lib/global/flags/intrinsic_flags";
import { insertStyleHTML } from "../../../../../utils/dom/style";
import { yield1 } from "../../../../../utils/misc/async";

export async function setupFavoritesBottomNavigationButtons(): Promise<void> {
  if (ON_MOBILE_DEVICE || !FavoritesSettings.bottomNavigationButtonsEnabled) {
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

  previousButton.title = "Next page";
  nextButton.title = "Previous page";

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

  insertStyleHTML(`
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
  await yield1();
  CONTENT_CONTAINER.insertAdjacentElement("afterend", container);
}
