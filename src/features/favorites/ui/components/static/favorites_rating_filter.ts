import { Events } from "../../../../../lib/global/events/events";
import { ON_MOBILE_DEVICE } from "../../../../../lib/global/flags/intrinsic_flags";
import { Preferences } from "../../../../../lib/global/preferences/preferences";
import { Rating } from "../../../../../types/common_types";
import { capitalize } from "../../../../../utils/primitive/string";
import { hasTagName } from "../../../../../utils/dom/dom";

type RatingElement = {
  input: HTMLInputElement
  label: HTMLLabelElement
}

let parentContainer: HTMLElement = document.createElement("div");
const CONTAINER = createContainer();
const EXPLICIT = createRatingElement("explicit");
const QUESTIONABLE = createRatingElement("questionable");
const SAFE = createRatingElement("safe");

export function insertFavoritesRatingFilter(): void {
  if (ON_MOBILE_DEVICE) {
    return;
  }
  parentContainer = document.getElementById("rating-container") ?? parentContainer;
  parentContainer.appendChild(createLabel());
  parentContainer.appendChild(document.createElement("br"));
  parentContainer.appendChild(CONTAINER);
  changeWhichRatingsAreSelected(Preferences.allowedRatings.value);
  addEventListeners();
}

function createContainer(): HTMLElement {
  const container = document.createElement("div");

  container.id = "allowed-ratings";
  container.className = "not-highlightable";
  return container;
}

function createLabel(): HTMLLabelElement {
  const label = document.createElement("label");

  label.htmlFor = "allowed-ratings";
  label.textContent = "Rating";
  return label;
}

function createRatingElement(ratingName: string): RatingElement {
  const input = document.createElement("input");
  const label = document.createElement("label");

  input.type = "checkbox";
  input.id = `${ratingName}-rating`;
  label.htmlFor = input.id;
  label.textContent = capitalize(ratingName);
  CONTAINER.appendChild(input);
  CONTAINER.appendChild(label);
  return {
    input,
    label
  };
}

function addEventListeners(): void {
  CONTAINER.onclick = (event): void => {
    if (event.target === null || hasTagName(event.target, "label")) {
      return;
    }
    const rating = getCurrentRating();

    Events.favorites.allowedRatingsChanged.emit(rating);
    preventAllRatingsFromBeingUnselected();
    Preferences.allowedRatings.set(rating);
  };
}

function getCurrentRating(): Rating {
  const rating = (4 * Number(EXPLICIT.input.checked)) + (2 * Number(QUESTIONABLE.input.checked)) + Number(SAFE.input.checked);
  return rating as Rating;
}

function changeWhichRatingsAreSelected(rating: Rating): void {
  // eslint-disable-next-line no-bitwise
  EXPLICIT.input.checked = (rating & 4) === 4;
  // eslint-disable-next-line no-bitwise
  QUESTIONABLE.input.checked = (rating & 2) === 2;
  // eslint-disable-next-line no-bitwise
  SAFE.input.checked = (rating & 1) === 1;
  preventAllRatingsFromBeingUnselected();
}

function preventAllRatingsFromBeingUnselected(): void {
  switch (getCurrentRating()) {
    case 4:
      EXPLICIT.label.style.pointerEvents = "none";
      break;

    case 2:
      QUESTIONABLE.label.style.pointerEvents = "none";
      break;

    case 1:
      SAFE.label.style.pointerEvents = "none";
      break;

    default:
      for (const element of [EXPLICIT, QUESTIONABLE, SAFE]) {
        element.label.removeAttribute("style");
      }
      break;
  }
}
