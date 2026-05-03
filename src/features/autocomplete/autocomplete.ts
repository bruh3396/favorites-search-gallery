import { AwesompleteConstructor, AwesompleteInstance, AwesompleteSuggestion } from "../../types/ui";
import { AUTOCOMPLETE_DISABLED } from "../../lib/environment/derived_environment";
import { Preferences } from "../../lib/preferences/preferences";
import { addAwesompleteToGlobalScope } from "./autocomplete_awesomplete_implementation";
import { addCustomTagsToAutocomplete } from "../favorites/model/tags/favorites_custom_tags";
import { fetchHtml } from "../../lib/server/http/http_client";
import { getSavedSearchesSuggestions } from "./autocomplete_saved_search";
import { hideAwesomplete } from "../../lib/ui/awesomplete";
import { isEmptyString } from "../../utils/string/query";
import { removeLeadingHyphens } from "../../utils/string/format";
import { replaceTagInText } from "./autocomplete_tag_replacer";

declare const Awesomplete_: AwesompleteConstructor;

const AUTOCOMPLETE_API_URL = "https://ac.rule34.xxx/autocomplete.php?q=";
const dummyElement = document.createElement("div");

function decodeEntities(encodedString: string): string {
  encodedString = encodedString.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, "");
  encodedString = encodedString.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, "");
  encodedString = encodedString.replace(/\w+_saved_search\s*/, "");
  dummyElement.innerHTML = encodedString;
  encodedString = dummyElement.textContent ?? "";
  dummyElement.textContent = "";
  return encodedString;
}

function getAutocompleteSuggestions(prefix: string): Promise<string> {
  return fetchHtml(`${AUTOCOMPLETE_API_URL}${prefix}`);
}

function getFinalAutocompleteSuggestions(html: string, prefix: string): AwesompleteSuggestion[] {
  const suggestions = addCustomTagsToAutocomplete(JSON.parse(html), prefix);
  return Preferences.savedSearchSuggestions.value ? suggestions.concat(getSavedSearchesSuggestions(prefix)) : suggestions;
}

async function populateAwesompleteList(inputId: string, prefix: string, awesomplete: AwesompleteInstance): Promise<void> {
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
  const result = replaceTagInText(input.value, input.selectionStart ?? -1, suggestion);

  input.value = result.result;
  input.selectionStart = result.selectionStart;
  input.selectionEnd = result.selectionStart;
}

function createAwesompleteInstance(input: HTMLTextAreaElement | HTMLInputElement): AwesompleteInstance {
  const awesomplete = new Awesomplete_(input, {
    minChars: 1,
    list: [],
    filter: (suggestion: AwesompleteSuggestion, _: unknown): boolean => {
      return Awesomplete_.FILTER_STARTSWITH(suggestion.value, getCurrentTag(awesomplete.input).replaceAll("*", ""));
    },
    sort: false,
    item: (suggestion: AwesompleteSuggestion, tags: string): HTMLElement => {
      const html = isEmptyString(tags) ? suggestion.label : suggestion.label.replace(RegExp(Awesomplete_.$.regExpEscape(tags.trim()), "gi"), "<mark>$&</mark>");
      return Awesomplete_.$.create("li", {
        innerHTML: html,
        "aria-selected": "false",
        className: `tag-type-${suggestion.type}`
      });
    },
    replace: (suggestion: AwesompleteSuggestion): void => {
      insertSuggestion(awesomplete.input, decodeEntities(suggestion.value));
      awesomplete.input.dispatchEvent(new Event("input"));
    }
  });
  return awesomplete;
}

function addAwesompleteToInput(input: HTMLTextAreaElement | HTMLInputElement): void {
  addEventListenersToInput(input, createAwesompleteInstance(input));
}

function addEventListenersToInput(input: HTMLTextAreaElement | HTMLInputElement, awesomplete: AwesompleteInstance): void {
  input.addEventListener("keydown", (event: Event) => {
    const keyEvent = event as KeyboardEvent;

    switch (keyEvent.key) {
      case "Tab":
        if (!awesomplete.isOpened || awesomplete.suggestions.length === 0) {
          return;
        }
        awesomplete.next();
        awesomplete.select();
        keyEvent.preventDefault();
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
  if (AUTOCOMPLETE_DISABLED) {
    return;
  }
  addAwesompleteToGlobalScope();
  addAwesompleteToAllInputs();
}
