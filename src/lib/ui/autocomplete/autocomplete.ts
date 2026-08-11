import { AUTOCOMPLETE_SELECTOR, hideAwesomplete } from "@/lib/ui/autocomplete/awesomplete";
import Awesomplete, { AwesompleteSuggestion } from "awesomplete";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { addCustomTagsToAutocomplete } from "@/lib/search/tags/custom_tags";
import { fetchHtml } from "@/lib/remote/http/client";
import { isEmptyString } from "@/utils/string/query";
import { queueMacroTask } from "@/lib/async/async";
import { removeLeadingHyphens } from "@/utils/string/format";
import { replaceTagInText } from "@/lib/ui/autocomplete/tag_replacer";

export function setupAutocomplete(): void {
  if (ON_FAVORITES_PAGE) {
    queueMacroTask(addAwesompleteToAllInputs);
  }
}

function addAwesompleteToAllInputs(): void {
  for (const input of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(AUTOCOMPLETE_SELECTOR)) {
    addEventListenersToInput(input, createAwesompleteInstance(input));
  }
}

function createAwesompleteInstance(input: HTMLTextAreaElement | HTMLInputElement): Awesomplete {
  const types = new Map<string, string>();
  const awesomplete = new Awesomplete(input, {
    minChars: 1,
    list: [],
    sort: false,
    data: (suggestion: AwesompleteSuggestion): AwesompleteSuggestion => rememberTagType(types, suggestion),
    filter: (suggestion: AwesompleteSuggestion): boolean => matchesCurrentTag(suggestion, awesomplete.input),
    item: (suggestion: AwesompleteSuggestion, tags: string): HTMLElement => renderSuggestion(suggestion, tags, types),
    replace: (suggestion: AwesompleteSuggestion): void => applySuggestion(suggestion, awesomplete.input)
  });
  return awesomplete;
}

function rememberTagType(types: Map<string, string>, suggestion: AwesompleteSuggestion): AwesompleteSuggestion {
  types.set(suggestion.value, suggestion.type);
  return suggestion;
}

function matchesCurrentTag(suggestion: AwesompleteSuggestion, input: HTMLTextAreaElement | HTMLInputElement): boolean {
  // eslint-disable-next-line new-cap
  return Awesomplete.FILTER_STARTSWITH(suggestion.value, getCurrentTag(input).replaceAll("*", ""));
}

function renderSuggestion(suggestion: AwesompleteSuggestion, tags: string, types: Map<string, string>): HTMLElement {
  return Awesomplete.$.create("li", {
    innerHTML: highlightMatch(suggestion.label, tags),
    "aria-selected": "false",
    className: `tag-type-${types.get(suggestion.value)}`
  });
}

function highlightMatch(label: string, tags: string): string {
  if (isEmptyString(tags)) {
    return label;
  }
  return label.replace(RegExp(Awesomplete.$.regExpEscape(tags.trim()), "gi"), "<mark>$&</mark>");
}

function applySuggestion(suggestion: AwesompleteSuggestion, input: HTMLTextAreaElement | HTMLInputElement): void {
  insertSuggestion(input, decodeEntities(suggestion.value));
  input.dispatchEvent(new Event("input"));
}

function getCurrentTag(input: HTMLInputElement | HTMLTextAreaElement): string {
  return getLastTag(input.value.slice(0, input.selectionStart ?? 0));
}

function getLastTag(searchQuery: string): string {
  const lastTag = searchQuery.match(/[^ -]\S*$/);
  return lastTag === null ? "" : lastTag[0];
}

function insertSuggestion(input: HTMLInputElement | HTMLTextAreaElement, suggestion: string): void {
  const result = replaceTagInText(input.value, input.selectionStart ?? -1, suggestion);

  input.value = result.result;
  input.selectionStart = result.selectionStart;
  input.selectionEnd = result.selectionStart;
}

function decodeEntities(encodedString: string): string {
  const dummyElement = document.createElement("div");

  encodedString = encodedString.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, "");
  encodedString = encodedString.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, "");
  dummyElement.innerHTML = encodedString;
  encodedString = dummyElement.textContent ?? "";
  dummyElement.textContent = "";
  return encodedString;
}

function addEventListenersToInput(input: HTMLTextAreaElement | HTMLInputElement, awesomplete: Awesomplete): void {
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

function getCurrentTagWithHyphen(input: HTMLInputElement | HTMLTextAreaElement): string {
  const selectionStart = input.selectionStart ?? undefined;
  return getLastTagWithHyphen(input.value.slice(0, selectionStart));
}

function getLastTagWithHyphen(searchQuery: string): string {
  const lastTag = searchQuery.match(/[^ ]*$/);
  return lastTag === null ? "" : lastTag[0];
}

async function populateAwesompleteList(inputId: string, prefix: string, awesomplete: Awesomplete): Promise<void> {
  if (isEmptyString(prefix)) {
    return;
  }
  prefix = removeLeadingHyphens(prefix);
  const html = await getAutocompleteSuggestions(prefix);

  awesomplete.list = getFinalAutocompleteSuggestions(html, prefix);
}

function getAutocompleteSuggestions(prefix: string): Promise<string> {
  return fetchHtml(`https://ac.rule34.xxx/autocomplete.php?q=${prefix}`);
}

function getFinalAutocompleteSuggestions(html: string, prefix: string): AwesompleteSuggestion[] {
  return addCustomTagsToAutocomplete(JSON.parse(html), prefix);
}
