import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Favorite } from "@/types/favorite";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Snippet } from "@/features/favorites/features/snippets/types/types";
import { Snippets } from "@/features/favorites/features/snippets/snippets";
import { createSnippet } from "@/features/favorites/features/snippets/testing/snippets";
import { flushMicrotasks } from "@/testing/async";

const STORAGE_KEY = "searchSnippets";

let store: MemoryLocalKeyedValues;

interface Setup {
  snippets: Snippets;
  container: HTMLElement;
  actions: HTMLElement[];
  appended: string[];
  alerts: string[];
  saved: string[];
}

function setup(stored: Snippet[] = [], results: string[] = []): Setup {
  const appended: string[] = [];
  const alerts: string[] = [];
  const saved: string[] = [];
  const container = document.createElement("div");

  store.set(STORAGE_KEY, stored);
  vi.stubGlobal("alert", (message: string): number => alerts.push(message));
  vi.stubGlobal("confirm", (): boolean => true);
  vi.stubGlobal("fetch", (): Promise<Response> => Promise.resolve(new Response("[]")));
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function save(this: HTMLAnchorElement): void {
    saved.push(this.download);
  });

  const snippets = new Snippets({
    appendToSearch: (text): number => appended.push(text),
    getSearchResults: (): Favorite[] => results.map(id => ({ id }) as Favorite),
    store
  });
  const section = snippets.buildDrawerSection();

  section.mount?.(container);
  document.body.append(container);
  return { snippets, container, actions: section.actions ?? [], appended, alerts, saved };
}

function readNames(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-snippet-name]")).map(row => row.dataset.snippetName ?? "");
}

function storedNames(): string[] {
  return ((store.get(STORAGE_KEY) ?? []) as Snippet[]).map(snippet => snippet.name);
}

function click(container: HTMLElement, action: string, name?: string): void {
  const scope = name === undefined ? container : container.querySelector(`[data-snippet-name="${name}"]`) as HTMLElement;

  (scope.querySelector(`[data-snippet-action="${action}"]`) as HTMLElement).click();
}

function queryFilterInput(container: HTMLElement): HTMLInputElement {
  return container.querySelectorAll("input")[0];
}

function queryNameInput(container: HTMLElement): HTMLInputElement {
  return container.querySelectorAll("input")[1];
}

function queryQueryTextarea(container: HTMLElement): HTMLTextAreaElement {
  return container.querySelector("textarea") as HTMLTextAreaElement;
}

function type(field: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  field.value = value;
  field.dispatchEvent(new Event("input"));
}

const fruits = createSnippet("fruits", "( apple ~ banana )", 0, 100);
const veg = createSnippet("veg", "carrot", 0, 200);

beforeEach(() => {
  store = new MemoryLocalKeyedValues();
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("section", () => {
  test("lists the stored snippets newest first", () => {
    expect(readNames(setup([fruits, veg]).container)).toEqual(["veg", "fruits"]);
  });

  test("filters the list as the user types", () => {
    const { container } = setup([fruits, veg]);

    type(queryFilterInput(container), "carrot");
    expect(readNames(container)).toEqual(["veg"]);
  });

  test("suggests stored snippets to the search box", () => {
    expect(setup([fruits]).snippets.suggestions("/").map(suggestion => suggestion.value)).toEqual(["/fruits"]);
  });
});

describe("rows", () => {
  test("clicking a row appends its query to the search", () => {
    const { container, appended } = setup([fruits]);

    click(container, "use");
    expect(appended).toEqual(["( apple ~ banana )"]);
  });

  test("move to top makes the snippet the newest", () => {
    const { container } = setup([fruits, veg]);

    click(container, "moveToTop", "fruits");
    expect(readNames(container)).toEqual(["fruits", "veg"]);
  });

  test("delete asks first, then removes the snippet", () => {
    const { container } = setup([fruits]);

    click(container, "requestDelete", "fruits");
    expect(container.textContent).toContain("Delete this snippet?");
    click(container, "delete", "fruits");
    expect(storedNames()).toEqual([]);
    expect(container.textContent).toContain("No snippets yet");
  });

  test("cancelling a delete keeps the snippet", () => {
    const { container } = setup([fruits]);

    click(container, "requestDelete", "fruits");
    click(container, "cancelDelete", "fruits");
    expect(container.textContent).not.toContain("Delete this snippet?");
    expect(storedNames()).toEqual(["fruits"]);
  });
});

describe("editor", () => {
  test("saves a new snippet", () => {
    const { container } = setup();

    type(queryNameInput(container), "My Fruits");
    type(queryQueryTextarea(container), "apple");
    click(container, "save");
    expect(readNames(container)).toEqual(["my_fruits"]);
    expect(storedNames()).toEqual(["my_fruits"]);
  });

  test("edits an existing snippet", () => {
    const { container } = setup([fruits]);

    click(container, "edit", "fruits");
    expect(container.textContent).toContain("Editing /fruits");
    type(queryNameInput(container), "berries");
    click(container, "save");
    expect(storedNames()).toEqual(["berries"]);
  });

  test("escape cancels an edit", () => {
    const { container } = setup([fruits]);

    click(container, "edit", "fruits");
    queryNameInput(container).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(container.textContent).toContain("New snippet");
    expect(queryNameInput(container).value).toBe("");
  });

  test("cancelling an edit returns to a new snippet", () => {
    const { container } = setup([fruits]);

    click(container, "edit", "fruits");
    click(container, "cancelEdit");
    expect(container.textContent).toContain("New snippet");
  });

  test("shows a failed save until the user types again", () => {
    const { container } = setup();

    click(container, "save");
    expect(container.textContent).toContain("A snippet needs a name");
    type(queryNameInput(container), "fruits");
    expect(container.textContent).not.toContain("A snippet needs a name");
  });

  test("builds a query from the search results", () => {
    const { container } = setup([], ["1", "2"]);

    click(container, "fillQueryFromResults");
    expect(queryQueryTextarea(container).value).toBe("( 1 ~ 2 )");
  });

  test("alerts when there are no search results", () => {
    const { container, alerts } = setup();

    click(container, "fillQueryFromResults");
    expect(alerts).toEqual(["No search results to build a query from"]);
  });
});

describe("actions", () => {
  test("import replaces the snippets with the chosen file's", async() => {
    const { container, actions } = setup([fruits]);

    vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(function choose(this: HTMLInputElement): void {
      Object.defineProperty(this, "files", { value: [new File([JSON.stringify([{ name: "veg", query: "carrot" }])], "snippets.json")] });
      this.dispatchEvent(new Event("change"));
    });
    actions[0].click();
    await flushMicrotasks();
    expect(readNames(container)).toEqual(["veg"]);
  });

  test("export saves the snippets to a json file", () => {
    const { actions, saved } = setup([fruits]);

    actions[1].click();
    expect(saved).toEqual(["snippets.json"]);
  });

  test("delete all removes every snippet once confirmed", () => {
    const { container, actions } = setup([fruits, veg]);

    actions[2].click();
    expect(readNames(container)).toEqual([]);
    expect(storedNames()).toEqual([]);
  });
});
