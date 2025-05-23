/* eslint-disable */
// @ts-nocheck

import { isEmptyString } from "../../utils/primitive/string";
import { AWESOMPLETE_ENABLED } from "../../lib/globals/flags";
import { Events } from "../../lib/globals/events";
import { addAwesompleteToGlobalScope } from "./awesomplete_implementation";
import { hideAwesomplete } from "../../utils/dom/awesomplete";
import { getQueryWithTagReplaced } from "./autocomplete_utils";

const DUMMY_ELEMENT = document.createElement("div");

function decodeEntities(encodedString: string): string {
  encodedString = encodedString.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, "");
  encodedString = encodedString.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, "");
  DUMMY_ELEMENT.innerHTML = encodedString;
  encodedString = DUMMY_ELEMENT.textContent ?? "";
  DUMMY_ELEMENT.textContent = "";
  return encodedString;
}

// function getSavedSearchesForAutocompleteList(inputId: string, prefix: string): AwesompleteSuggestion[] {
//   if (ON_MOBILE_DEVICE || !Preferences.savedSearchSuggestionsEnabled.value || inputId !== Utils.mainSearchBoxId) {
//     return [];
//   }
//   return Utils.getSavedSearchesForAutocompleteList(prefix);
// }

function populateAwesompleteList(inputId: string, prefix: string, awesomplete: Awesomplete_): void {
  if (isEmptyString(prefix)) {
    return;
  }
  // const savedSearchSuggestions = getSavedSearchesForAutocompleteList(inputId, prefix);

  prefix = prefix.replace(/^[-*]*/, "");
  fetch(`https://ac.rule34.xxx/autocomplete.php?q=${prefix}`)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(response.statusText);
    })
    .then((suggestions) => {
      // const mergedSuggestions = Utils.addCustomTagsToAutocompleteList(JSON.parse(suggestions), prefix);

      // awesomplete.list = mergedSuggestions.concat(savedSearchSuggestions);
      awesomplete.list = JSON.parse(suggestions);
    });
}

function getCurrentTag(input: HTMLInputElement | HTMLTextAreaElement): string {
  return getLastTag(input.value.slice(0, input.selectionStart || 0));
}

function getLastTag(searchQuery: string): string {
  const lastTag = searchQuery.match(/[^ -]\S*$/);
  return lastTag === null ? "" : lastTag[0];
}

function getLastTagWithHyphen(searchQuery: string): string {
  const lastTag = searchQuery.match(/[^ ]*$/);
  return lastTag === null ? "" : lastTag[0];
}

function getCurrentTagWithHyphen(input: HTMLInputElement | HTMLTextAreaElement): string {
  const selectionStart = input.selectionStart ?? undefined;
  return getLastTagWithHyphen(input.value.slice(0, selectionStart));
}

function insertSuggestion(input: HTMLInputElement | HTMLTextAreaElement, suggestion: string): void {
  const result = getQueryWithTagReplaced(input.value, input.selectionStart ?? -1, suggestion);
  input.value = result.result;
  input.selectionStart = result.selectionStart;
  input.selectionEnd = result.selectionStart;
}

function addAwesompleteToInput(input: HTMLTextAreaElement | HTMLInputElement): void {
  const awesomplete = new Awesomplete_(input, {
    minChars: 1,
    list: [],
    filter: (suggestion, _) => {

      return Awesomplete_.FILTER_STARTSWITH(suggestion.value, getCurrentTag(awesomplete.input).replaceAll("*", ""));
    },
    sort: false,
    item: (suggestion, tags) => {
      const html = isEmptyString(tags) ? suggestion.label : suggestion.label.replace(RegExp(Awesomplete_.$.regExpEscape(tags.trim()), "gi"), "<mark>$&</mark>");
      return Awesomplete_.$.create("li", {
        innerHTML: html,
        "aria-selected": "false",
        className: `tag-type-${suggestion.type}`
      });
    },
    replace: (suggestion): void => {
      // insertSuggestion(awesomplete.input, Utils.removeSavedSearchPrefix(decodeEntities(suggestion.value)));
      insertSuggestion(awesomplete.input, decodeEntities(suggestion.value));
      Events.favorites.searchBoxUpdated.emit();
    }
  });

  input.addEventListener("keydown", (event: KeyboardEvent) => {
    switch (event.key) {
      case "Tab":
        if (!awesomplete.isOpened || awesomplete.suggestions.length === 0) {
          return;
        }
        awesomplete.next();
        awesomplete.select();
        event.preventDefault();
        break;

      case "Escape":
        hideAwesomplete(input);
        break;

      default:
        break;
    }
  });

  input.oninput = (): void => {
    populateAwesompleteList(input.id, getCurrentTagWithHyphen(input), awesomplete);
  };
}

function addAwesompleteToAllInputs(): void {
  for (const textarea of document.querySelectorAll("textarea")) {
    addAwesompleteToInput(textarea);
  }

  for (const input of document.querySelectorAll("input")) {
    if (input.hasAttribute("needs-autocomplete")) {
      addAwesompleteToInput(input);
    }
  }
}

export function setupAutocomplete(): void {
  if (AWESOMPLETE_ENABLED) {
    addAwesompleteToGlobalScope();
    addAwesompleteToAllInputs();
  }
}
