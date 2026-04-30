import { Events } from "../../../../lib/communication/events/events";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { Preferences } from "../../../../lib/preferences/preferences";
import { debounceLeading } from "../../../../lib/core/scheduling/rate_limiting";

let container: HTMLElement;
let findButton: HTMLButtonElement;
let input: HTMLInputElement;

export function insertFavoritesFinder(): void {
  if (ON_MOBILE_DEVICE || !FavoritesSettings.favoriteFinderEnabled) {
    return;
  }
  const parent = document.querySelector("#left-favorites-panel-top-row");

  if (!(parent instanceof HTMLElement)) {
    return;
  }
  createElements();
  addEventListeners();
  appendElements(parent);
}

function createElements(): void {
  container = document.createElement("span");
  container.id = "favorite-finder";

  findButton = document.createElement("button");
  findButton.id = "favorite-finder-button";
  findButton.title = "Find favorite using its ID";
  findButton.textContent = "Find";

  input = document.createElement("input");
  input.id = "favorite-finder-input";
  input.type = "number";
  input.value = Preferences.favoriteFinderId.value;
  input.placeholder = "ID";
}

function find(): void {
  Events.favorites.findFavoriteStarted.emit(input.value);
}

function setFinderValue(value: string): void {
  input.value = value;
  Preferences.favoriteFinderId.set(input.value);
}

function addEventListeners(): void {
  const setValue = debounceLeading((value : string) => {
    setFinderValue(value);
  }, 1000);

  findButton.onclick = find;
  input.onkeydown = (event): void => {
    if (event.key === "Enter") {
      find();
    }
  };
  input.oninput = ((event: Event): void => {
    setValue((event.target as HTMLInputElement).value);
  });
  Events.caption.idClicked.on(setValue);
}

function appendElements(parent: HTMLElement): void {
  container.appendChild(input);
  container.appendChild(findButton);
  parent.appendChild(container);
}
