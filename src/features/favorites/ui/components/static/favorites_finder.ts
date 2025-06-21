import { Events } from "../../../../../lib/global/events/events";
import { FavoritesSettings } from "../../../../../config/favorites_settings";
import { ON_MOBILE_DEVICE } from "../../../../../lib/global/flags/intrinsic_flags";
import { Preferences } from "../../../../../store/local_storage/preferences";
import { debounceAfterFirstCall } from "../../../../../utils/misc/async";

let parent1: HTMLElement;
let container: HTMLElement;
let findButton: HTMLButtonElement;
let findInAllButton: HTMLButtonElement;
let input: HTMLInputElement;

export function insertFavoritesFinder(): void {
  if (ON_MOBILE_DEVICE || !FavoritesSettings.favoriteFinderEnabled) {
    return;
  }
  const foundParent = document.querySelector("#left-favorites-panel-top-row");

  if (!(foundParent instanceof HTMLElement)) {
    return;
  }
  parent1 = foundParent;
  createElements();
  addEventListeners();
  appendElements();
}

function createElements(): void {
  container = document.createElement("span");
  container.id = "favorite-finder";

  findButton = document.createElement("button");
  findButton.id = "favorite-finder-button";
  findButton.title = "Find favorite favorite using its ID";
  findButton.textContent = "Find";

  findInAllButton = document.createElement("button");
  findInAllButton.id = "favorite-finder-in-all-button";
  findInAllButton.title = "Find favorite favorite using its ID in all Favorites";
  findInAllButton.textContent = "Find in All";

  input = document.createElement("input");
  input.id = "favorite-finder-input";
  input.type = "number";
  input.value = Preferences.favoriteFinderId.value;
  input.placeholder = "ID";
}

function find(): void {
  Events.favorites.findFavoriteStarted.emit(input.value);
}

function findInAll(): void {
  Events.favorites.findFavoriteInAllStarted.emit(input.value);
}

function setFinderValue(value: string): void {
  input.value = value;
  Preferences.favoriteFinderId.set(input.value);
}

function addEventListeners(): void {
  const setValue = debounceAfterFirstCall((value : string) => {
    setFinderValue(value);
  }, 1000);

  findButton.onclick = find;
  findInAllButton.onclick = findInAll;
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

function appendElements(): void {
  container.appendChild(input);
  // container.appendChild(document.createElement("br"));
  container.appendChild(findButton);
  // container.appendChild(findInAllButton);
  parent1.appendChild(container);
}
