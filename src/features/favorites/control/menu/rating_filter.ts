import { Events } from "../../../../lib/communication/events";
import { ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { Preferences } from "../../../../lib/preferences/preferences";
import { Rating } from "../../../../types/search";
import { capitalize } from "../../../../utils/string/format";
import { hasTagName } from "../../../../utils/dom/interaction";

type RatingElement = {
  input: HTMLInputElement
  label: HTMLLabelElement
}

let parentContainer: HTMLElement = document.createElement("div");
const mainContainer = createContainer();
const explicit = createRatingElement("explicit");
const questionable = createRatingElement("questionable");
const safe = createRatingElement("safe");

export function setupFavoritesRatingFilter(): void {
  if (ON_MOBILE_DEVICE) {
    return;
  }
  parentContainer = document.getElementById("rating-container") ?? parentContainer;
  parentContainer.appendChild(createLabel());
  parentContainer.appendChild(document.createElement("br"));
  parentContainer.appendChild(mainContainer);
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
  mainContainer.appendChild(input);
  mainContainer.appendChild(label);
  return {
    input,
    label
  };
}

function addEventListeners(): void {
  mainContainer.onclick = (event): void => {
    if (event.target === null || hasTagName(event.target, "label")) {
      return;
    }
    const rating = getCurrentRating();

    Preferences.allowedRatings.set(rating);
    Events.favorites.allowedRatingsChanged.emit(rating);
    preventAllRatingsFromBeingUnselected();
  };
}

function getCurrentRating(): Rating {
  const rating = (4 * Number(explicit.input.checked)) + (2 * Number(questionable.input.checked)) + Number(safe.input.checked);
  return rating as Rating;
}

function changeWhichRatingsAreSelected(rating: Rating): void {
  explicit.input.checked = (rating & 4) === 4;
  questionable.input.checked = (rating & 2) === 2;
  safe.input.checked = (rating & 1) === 1;
  preventAllRatingsFromBeingUnselected();
}

function preventAllRatingsFromBeingUnselected(): void {
  switch (getCurrentRating()) {
    case 4: explicit.label.style.pointerEvents = "none";
      break;
    case 2: questionable.label.style.pointerEvents = "none";
      break;
    case 1: safe.label.style.pointerEvents = "none";
      break;
    default:
      for (const element of [explicit, questionable, safe]) {
        element.label.removeAttribute("style");
      }
      break;
  }
}
