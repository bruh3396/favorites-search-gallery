import { Events } from "../../../../app/channels/events";
import { FavoritesConfig } from "../../../../config/favorites_config";
import { ON_MOBILE_DEVICE } from "../../../../lib/environment";
import { Preferences } from "../../../../app/context/preferences";
import { debounceLeading } from "../../../../lib/async/debounce";

let container: HTMLElement;
let findButton: HTMLButtonElement;
let input: HTMLInputElement;

export function setup(): void {
  if (ON_MOBILE_DEVICE || !FavoritesConfig.favoriteFinderEnabled) {
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

function triggerFind(): void {
  Events.favorites.findFavorite.emit(input.value);
}

function setFinderValue(value: string): void {
  input.value = value;
  Preferences.favoriteFinderId.set(input.value);
}

function addEventListeners(): void {
  const setValue = debounceLeading(setFinderValue, 1000);

  findButton.onclick = triggerFind;
  input.onkeydown = (event): void => {
    if (event.key === "Enter") {
      triggerFind();
    }
  };
  input.oninput = ((): void => {
    setValue(input.value);
  });
  Events.caption.idClicked.on(setValue);
}

function appendElements(parent: HTMLElement): void {
  container.appendChild(input);
  container.appendChild(findButton);
  parent.appendChild(container);
}
