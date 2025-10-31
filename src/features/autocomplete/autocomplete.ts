/* eslint-disable new-cap */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { isEmptyString, removeLeadingHyphens } from "../../utils/primitive/string";
import { AWESOMPLETE_ENABLED } from "../../lib/global/flags/derived_flags";
import { AwesompleteSuggestion } from "../../types/common_types";
import { Events } from "../../lib/global/events/events";
import { Preferences } from "../../lib/global/preferences/preferences";
import { addAwesompleteToGlobalScope } from "./autocomplete_awesomplete_implementation";
import { addCustomTagsToAutocomplete } from "../../lib/global/custom_tags";
import { getHTML } from "../../lib/api/api";
import { getQueryWithTagReplaced } from "./autocomplete_tag_replacer";
import { getSavedSearchesSuggestions } from "./autocomplete_saved_search";
import { hideAwesomplete } from "../../utils/dom/awesomplete";

const DUMMY_ELEMENT = document.createElement("div");
const AUTOCOMPLETE_API_URL = "https://ac.rule34.xxx/autocomplete.php?q=";

function decodeEntities(encodedString: string): string {
  encodedString = encodedString.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, "");
  encodedString = encodedString.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, "");
  encodedString = encodedString.replace(/\w+_saved_search\s*/, "");
  DUMMY_ELEMENT.innerHTML = encodedString;
  encodedString = DUMMY_ELEMENT.textContent ?? "";
  DUMMY_ELEMENT.textContent = "";
  return encodedString;
}

function getAutocompleteSuggestions(prefix: string): Promise<AwesompleteSuggestion[]> {
  return getHTML(`${AUTOCOMPLETE_API_URL}${prefix}`);
}

function getFinalAutocompleteSuggestions(html: string, prefix: string): AwesompleteSuggestion[] {
  const suggestions = addCustomTagsToAutocomplete(JSON.parse(html), prefix);
  return Preferences.savedSearchSuggestionsEnabled.value ? suggestions.concat(getSavedSearchesSuggestions(prefix)) : suggestions;
}

async function populateAwesompleteList(inputId: string, prefix: string, awesomplete: Awesomplete_): Promise<void> {
  if (isEmptyString(prefix)) {
    return;
  }
  prefix = removeLeadingHyphens(prefix);
  const html = await getAutocompleteSuggestions(prefix);

  awesomplete.list = getFinalAutocompleteSuggestions(html, prefix);
}

function getCurrentTag(input: HTMLInputElement | HTMLTextAreaElement): string {
  return getLastTag(input.value.slice(0, input.selectionStart ?? 0));
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

function createAwesompleteInstance(input: HTMLTextAreaElement | HTMLInputElement): Awesomplete_ {
  const awesomplete = new Awesomplete_(input, {
    minChars: 1,
    list: [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filter: (suggestion: AwesompleteSuggestion, _: unknown): void => {
      return Awesomplete_.FILTER_STARTSWITH(suggestion.value, getCurrentTag(awesomplete.input).replaceAll("*", ""));
    },
    sort: false,
    item: (suggestion: AwesompleteSuggestion, tags: string): void => {
      const html = isEmptyString(tags) ? suggestion.label : suggestion.label.replace(RegExp(Awesomplete_.$.regExpEscape(tags.trim()), "gi"), "<mark>$&</mark>");
      return Awesomplete_.$.create("li", {
        innerHTML: html,
        "aria-selected": "false",
        className: `tag-type-${suggestion.type}`
      });
    },
    replace: (suggestion: AwesompleteSuggestion): void => {
      insertSuggestion(awesomplete.input, decodeEntities(suggestion.value));
      Events.favorites.searchBoxUpdated.emit();
    }
  });
  return awesomplete;
}

function addAwesompleteToInput(input: HTMLTextAreaElement | HTMLInputElement): void {
  addEventListenersToInput(input, createAwesompleteInstance(input));
}

function addEventListenersToInput(input: HTMLTextAreaElement | HTMLInputElement, awesomplete: Awesomplete_): void {
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
  for (const input of document.querySelectorAll("textarea, input[needs-autocomplete]")) {
    addAwesompleteToInput(input as HTMLTextAreaElement | HTMLInputElement);
  }
}

export function setupAutocomplete(): void {
  if (AWESOMPLETE_ENABLED) {
    addAwesompleteToGlobalScope();
    addAwesompleteToAllInputs();
  }
}
