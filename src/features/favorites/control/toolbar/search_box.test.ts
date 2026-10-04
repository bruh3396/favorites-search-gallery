import { Events, createEvents } from "@/app/context/events";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FavoritesSearchBox } from "@/features/favorites/control/toolbar/search_box";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";

interface Setup {
  searchBox: FavoritesSearchBox;
  field: HTMLElement;
  input: HTMLTextAreaElement;
  clearButton: HTMLButtonElement;
  events: Events;
  storage: MemoryLocalKeyedValues;
  searched: string[];
  postLists: string[];
}

function setup(storage = new MemoryLocalKeyedValues()): Setup {
  const environment = createEnvironment();
  const appShell = new Shell();
  const shell = new FavoritesShell(environment, appShell);
  const events = createEvents();
  const searched: string[] = [];
  const postLists: string[] = [];

  events.favorites.searchRequested.on(query => searched.push(query));
  events.favorites.postListRequested.on(query => postLists.push(query));
  document.body.append(appShell.root);
  const searchBox = new FavoritesSearchBox(events, shell.toolbar, storage);
  return {
    searchBox,
    field: shell.toolbar.searchField,
    input: shell.toolbar.searchField.querySelector("textarea") as HTMLTextAreaElement,
    clearButton: shell.toolbar.searchActions.querySelector("button") as HTMLButtonElement,
    events,
    storage,
    searched,
    postLists
  };
}

function type(input: HTMLTextAreaElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event("input"));
}

function press(input: HTMLTextAreaElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, cancelable: true, ...init });

  input.dispatchEvent(event);
  return event;
}

function click(init: MouseEventInit = {}): MouseEvent {
  return new MouseEvent("click", init);
}

// Awesomplete's own markup: a visible list whose item is aria-selected.
function showSuggestion(input: HTMLTextAreaElement, selected: boolean): void {
  const list = input.parentElement?.querySelector("ul") as HTMLUListElement;
  const item = document.createElement("li");

  item.setAttribute("aria-selected", String(selected));
  list.removeAttribute("hidden");
  list.append(item);
}

function isHidden(element: HTMLElement): boolean {
  return element.dataset.hidden !== undefined;
}

function isExpanded(field: HTMLElement): boolean {
  return field.dataset.expanded !== undefined;
}

function wrapLongQueries(input: HTMLTextAreaElement): void {
  Object.defineProperty(input, "clientHeight", { get: () => 40 });
  Object.defineProperty(input, "scrollHeight", { get: () => (input.value.length > 20 ? 120 : 40) });
}

describe("FavoritesSearchBox", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("[]")));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  test("searches for the typed query on Enter", () => {
    const { input, searched } = setup();

    type(input, "cat dog");
    const event = press(input, "Enter");

    expect(searched).toEqual(["cat dog"]);
    expect(event.defaultPrevented).toBe(true);
  });

  test("picks a highlighted suggestion on Enter instead of searching", () => {
    const { input, searched } = setup();

    type(input, "ca");
    showSuggestion(input, true);
    press(input, "Enter");

    expect(searched).toEqual([]);
  });

  test("searches on Enter when suggestions are showing but none is highlighted", () => {
    const { input, searched } = setup();

    type(input, "ca");
    showSuggestion(input, false);
    press(input, "Enter");

    expect(searched).toEqual(["ca"]);
  });

  test("searches only once while Enter is held", () => {
    const { input, searched } = setup();

    type(input, "cat");
    press(input, "Enter");
    press(input, "Enter", { repeat: true });

    expect(searched).toEqual(["cat"]);
  });

  test("searches for the typed query when the search button is clicked", () => {
    const { searchBox, input, searched, postLists } = setup();

    type(input, "cat");
    searchBox.handleSearchButtonClicked(click());

    expect(searched).toEqual(["cat"]);
    expect(postLists).toEqual([]);
  });

  test.each([
    ["ctrl-click", { ctrlKey: true }],
    ["right-click", { button: 2 }]
  ])("asks for the post list instead of searching on a %s of the search button", (_name, init) => {
    const { searchBox, input, searched, postLists } = setup();

    type(input, "cat");
    searchBox.handleSearchButtonClicked(click(init));

    expect(postLists).toEqual(["cat"]);
    expect(searched).toEqual([]);
  });

  test("shows the query and searches for it when told to search", () => {
    const { searchBox, input, searched } = setup();

    searchBox.search("cat");

    expect(input.value).toBe("cat");
    expect(searched).toEqual(["cat"]);
  });

  test("appends to the query, separated by a space", () => {
    const { searchBox, input } = setup();

    searchBox.append("cat");
    searchBox.append("-dog");

    expect(input.value).toBe("cat -dog");
  });

  test("empties the query when cleared", () => {
    const { searchBox, input } = setup();

    type(input, "cat");
    searchBox.clear();

    expect(input.value).toBe("");
  });

  test("hides the clear button exactly while the query is empty", () => {
    const { searchBox, input, clearButton } = setup();

    expect(isHidden(clearButton)).toBe(true);
    type(input, "cat");
    expect(isHidden(clearButton)).toBe(false);
    searchBox.clear();
    expect(isHidden(clearButton)).toBe(true);
    searchBox.append("dog");
    expect(isHidden(clearButton)).toBe(false);
  });

  test("asks for the search to be cleared when the clear button is clicked", () => {
    const { clearButton, events } = setup();
    const cleared = vi.fn();

    events.favorites.clearButtonClicked.on(cleared);
    clearButton.click();

    expect(cleared).toHaveBeenCalledOnce();
  });

  test("takes focus on the '/' hotkey", async() => {
    const { input, events } = setup();

    events.app.hotkeyPressed.emit("/");

    await vi.waitFor(() => expect(document.activeElement).toBe(input));
  });

  test("leaves focus alone on other hotkeys", async() => {
    const { input, events } = setup();

    events.app.hotkeyPressed.emit("d");
    await new Promise(resolve => setTimeout(resolve));
    expect(document.activeElement).not.toBe(input);
  });

  test("neither searches nor recalls history on other keys", () => {
    const { input, searched } = setup();

    type(input, "apple");
    press(input, "Enter");
    type(input, "banana");
    const event = press(input, "Tab");

    expect(input.value).toBe("banana");
    expect(searched).toEqual(["apple"]);
    expect(event.defaultPrevented).toBe(false);
  });

  test("grows to fit a long query while focused", () => {
    const { field, input } = setup();

    wrapLongQueries(input);
    input.focus();
    type(input, "apple banana cherry grape mango");
    expect(isExpanded(field)).toBe(true);
    expect(input.style.height).toBe("120px");
    type(input, "apple");
    expect(isExpanded(field)).toBe(false);
  });

  test("stays collapsed while not focused", () => {
    const { field, input } = setup();

    wrapLongQueries(input);
    type(input, "apple banana cherry grape mango");
    expect(isExpanded(field)).toBe(false);
  });

  test("collapses when focus leaves", () => {
    const { field, input } = setup();

    wrapLongQueries(input);
    input.focus();
    type(input, "apple banana cherry grape mango");
    input.blur();
    expect(isExpanded(field)).toBe(false);
    expect(input.style.height).not.toBe("120px");
  });

  test("recalls earlier searches on ArrowUp and returns to the draft on ArrowDown", () => {
    const { input } = setup();

    for (const query of ["cat", "dog"]) {
      type(input, query);
      press(input, "Enter");
    }
    type(input, "draft");

    press(input, "ArrowUp");
    expect(input.value).toBe("dog");
    press(input, "ArrowUp");
    expect(input.value).toBe("cat");
    press(input, "ArrowDown");
    press(input, "ArrowDown");
    expect(input.value).toBe("draft");
  });

  test("moves through suggestions, not history, on arrow keys while suggestions show", () => {
    const { input } = setup();

    type(input, "cat");
    press(input, "Enter");
    type(input, "do");
    showSuggestion(input, false);
    const event = press(input, "ArrowUp");

    expect(input.value).toBe("do");
    expect(event.defaultPrevented).toBe(false);
  });

  test("keeps the query being edited across a reload", () => {
    const storage = new MemoryLocalKeyedValues();
    const first = setup(storage);

    type(first.input, "cat");
    document.body.replaceChildren();

    expect(setup(storage).input.value).toBe("cat");
  });

  test("keeps past searches across a reload", () => {
    const storage = new MemoryLocalKeyedValues();
    const first = setup(storage);

    type(first.input, "cat");
    press(first.input, "Enter");
    document.body.replaceChildren();
    const { searchBox, input } = setup(storage);

    searchBox.clear();
    press(input, "ArrowUp");

    expect(input.value).toBe("cat");
  });
});
