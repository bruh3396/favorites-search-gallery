import { setDataset } from "@/utils/browser/dataset";

const AUTOCOMPLETE_DATASET_KEY = "autocomplete";

export const AUTOCOMPLETE_SELECTOR = `[data-${AUTOCOMPLETE_DATASET_KEY}]`;

export function markAsNeedingAutocomplete(input: HTMLInputElement | HTMLTextAreaElement): void {
  setDataset(input, AUTOCOMPLETE_DATASET_KEY);
}

export function hideAwesomplete(input: HTMLInputElement | HTMLTextAreaElement): void {
  const awesomplete = getAwesompleteFromInput(input);

  if (awesomplete !== null) {
    awesomplete.querySelector("ul")?.setAttribute("hidden", "");
  }
}

export function awesompleteIsVisible(input: HTMLInputElement | HTMLTextAreaElement): boolean {
  const awesomplete = getAwesompleteFromInput(input);

  if (awesomplete === null) {
    return false;
  }
  const awesompleteSuggestions = awesomplete.querySelector("ul");
  return awesompleteSuggestions !== null && !awesompleteSuggestions.hasAttribute("hidden");
}

export function awesompleteIsUnselected(input: HTMLInputElement | HTMLTextAreaElement): boolean {
  const awesomplete = getAwesompleteFromInput(input);

  if (awesomplete === null) {
    return true;
  }

  if (!awesompleteIsVisible(input)) {
    return true;
  }
  const searchSuggestions = Array.from(awesomplete.querySelectorAll("li"));

  if (searchSuggestions.length === 0) {
    return true;
  }
  const isSomethingSelected = searchSuggestions.map(li => li.getAttribute("aria-selected"))
    .some(element => element === "true");
  return !isSomethingSelected;
}

function getAwesompleteFromInput(input: HTMLInputElement | HTMLTextAreaElement): HTMLElement | null {
  const awesomplete = input.parentElement;

  if (awesomplete === null || awesomplete.className !== "awesomplete") {
    return null;
  }
  return awesomplete;
}
