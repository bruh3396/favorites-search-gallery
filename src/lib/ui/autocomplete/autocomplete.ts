import { AUTOCOMPLETE_SELECTOR, hideAwesomplete } from "@/lib/ui/autocomplete/awesomplete";
import Awesomplete, { AwesompleteSuggestion } from "awesomplete";
import { isEmptyString, removeLeadingModifiers } from "@/utils/pure/string";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { addCustomTagsToAutocomplete } from "@/lib/ui/autocomplete/custom_tags";
import { fetchHtml } from "@/utils/browser/http";
import { queueMacroTask } from "@/lib/async/scheduling";
import { replaceTagInText } from "@/lib/ui/autocomplete/tag_replacer";

type SnippetSuggestionSource = (prefix: string) => AwesompleteSuggestion[];

let getSnippetSuggestions: SnippetSuggestionSource = () => [];

export function setupAutocomplete(): void {
  if (ON_FAVORITES_PAGE) {
    queueMacroTask(addAwesompleteToAllInputs);
  }
}

export function setSnippetSuggestionSource(source: SnippetSuggestionSource): void {
  getSnippetSuggestions = source;
}

function addAwesompleteToAllInputs(): void {
  for (const input of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(AUTOCOMPLETE_SELECTOR)) {
    addEventListenersToInput(input, createAwesompleteInstance(input));
  }
}

function createAwesompleteInstance(input: HTMLTextAreaElement | HTMLInputElement): Awesomplete {
  const details = new Map<string, AwesompleteSuggestion>();
  const awesomplete = new Awesomplete(input, {
    minChars: 1,
    list: [],
    sort: false,
    data: (suggestion: AwesompleteSuggestion): AwesompleteSuggestion => rememberDetails(details, suggestion),
    filter: (suggestion: AwesompleteSuggestion): boolean => matchesCurrentTag(suggestion, awesomplete.input),
    item: (suggestion: AwesompleteSuggestion, tags: string): HTMLElement => renderSuggestion(suggestion, tags, details),
    replace: (suggestion: AwesompleteSuggestion): void => applySuggestion(suggestion, details, awesomplete.input)
  });
  return awesomplete;
}

function rememberDetails(details: Map<string, AwesompleteSuggestion>, suggestion: AwesompleteSuggestion): AwesompleteSuggestion {
  details.set(suggestion.value, suggestion);
  return suggestion;
}

function matchesCurrentTag(suggestion: AwesompleteSuggestion, input: HTMLTextAreaElement | HTMLInputElement): boolean {
  // eslint-disable-next-line new-cap
  return Awesomplete.FILTER_STARTSWITH(suggestion.value, getCurrentTag(input).replaceAll("*", ""));
}

function renderSuggestion(suggestion: AwesompleteSuggestion, tags: string, details: Map<string, AwesompleteSuggestion>): HTMLElement {
  return Awesomplete.$.create("li", {
    innerHTML: highlightMatch(suggestion.label, tags),
    "aria-selected": "false",
    className: `tag-type-${details.get(suggestion.value)?.type}`
  });
}

function highlightMatch(label: string, tags: string): string {
  if (isEmptyString(tags)) {
    return label;
  }
  return label.replace(RegExp(Awesomplete.$.regExpEscape(tags.trim()), "gi"), "<mark>$&</mark>");
}

function applySuggestion(suggestion: AwesompleteSuggestion, details: Map<string, AwesompleteSuggestion>, input: HTMLTextAreaElement | HTMLInputElement): void {
  const insert = details.get(suggestion.value)?.insert ?? suggestion.value;

  insertSuggestion(input, decodeEntities(insert));
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
  prefix = removeLeadingModifiers(prefix);
  const html = await getAutocompleteSuggestions(prefix);

  awesomplete.list = getFinalAutocompleteSuggestions(html, prefix);
}

function getAutocompleteSuggestions(prefix: string): Promise<string> {
  return fetchHtml(`https://ac.rule34.xxx/autocomplete.php?q=${prefix}`);
}

function getFinalAutocompleteSuggestions(html: string, prefix: string): AwesompleteSuggestion[] {
  return [...getSnippetSuggestions(prefix), ...addCustomTagsToAutocomplete(JSON.parse(html), prefix)];
}
