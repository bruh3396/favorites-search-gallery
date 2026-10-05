import { afterEach, describe, expect, test, vi } from "vitest";
import { Favorite } from "@/types/favorite";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryLocalSnippets } from "@/adapters/memory/ports/local_snippets/local_snippets";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Snippet } from "@/core/domain/snippet/snippet";
import { Snippets } from "@/features/favorites/features/snippets/snippets";
import { createSnippet } from "@/features/favorites/features/snippets/testing/snippets";
import { flushMicrotasks } from "@/testing/async";

interface Setup {
  snippets: Snippets;
  container: HTMLElement;
  actions: HTMLElement[];
  appended: string[];
  alerts: string[];
  saved: string[];
  readStoredNames: () => Promise<string[]>;
}

async function setup(stored: Snippet[] = [], results: string[] = []): Promise<Setup> {
  const appended: string[] = [];
  const alerts: string[] = [];
  const saved: string[] = [];
  const container = document.createElement("div");
  const localSnippets = new MemoryLocalSnippets();

  await localSnippets.setMany(stored);
  vi.stubGlobal("alert", (message: string): number => alerts.push(message));
  vi.stubGlobal("confirm", (): boolean => true);
  vi.stubGlobal("fetch", (): Promise<Response> => Promise.resolve(new Response("[]")));
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function save(this: HTMLAnchorElement): void {
    saved.push(this.download);
  });

  const snippets = new Snippets({
    appendToSearch: (text): number => appended.push(text),
    getSearchResults: (): Favorite[] => results.map(id => ({ id }) as Favorite),
    localSnippets,
    localKeyedValues: new MemoryLocalKeyedValues(),
    scheduler: new MemoryScheduler(1_000)
  });
  const section = snippets.buildDrawerSection();

  await snippets.load();
  section.mount?.(container);
  document.body.append(container);
  return {
    snippets,
    container,
    actions: section.actions ?? [],
    appended,
    alerts,
    saved,
    readStoredNames: async(): Promise<string[]> => (await localSnippets.getAll()).map(snippet => snippet.name)
  };
}

function readNames(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>("[data-snippet-name]")].map(row => row.dataset.snippetName ?? "");
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

const fruits = createSnippet("fruits", "( apple ~ banana )", { createdAt: 100 });
const veg = createSnippet("veg", "carrot", { createdAt: 200 });

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Snippets", () => {
  test("lists the stored snippets newest first", async() => {
    expect(readNames((await setup([fruits, veg])).container)).toEqual(["veg", "fruits"]);
  });

  test("filters the list as the user types", async() => {
    const { container } = await setup([fruits, veg]);

    type(queryFilterInput(container), "carrot");
    expect(readNames(container)).toEqual(["veg"]);
  });

  test("suggests stored snippets to the search box", async() => {
    expect((await setup([fruits])).snippets.suggestions("/").map(suggestion => suggestion.value)).toEqual(["/fruits"]);
  });

  test("appends a clicked row's query to the search", async() => {
    const { container, appended } = await setup([fruits]);

    click(container, "use");
    expect(appended).toEqual(["( apple ~ banana )"]);
  });

  test("makes a snippet the newest when moved to the top", async() => {
    const { container } = await setup([fruits, veg]);

    click(container, "moveToTop", "fruits");
    expect(readNames(container)).toEqual(["fruits", "veg"]);
  });

  test("asks before deleting a snippet, then removes it", async() => {
    const { container, readStoredNames } = await setup([fruits]);

    click(container, "requestDelete", "fruits");
    expect(container.textContent).toContain("Delete this snippet?");
    click(container, "delete", "fruits");
    expect(await readStoredNames()).toEqual([]);
    expect(container.textContent).toContain("No snippets yet");
  });

  test("keeps the snippet when a delete is cancelled", async() => {
    const { container, readStoredNames } = await setup([fruits]);

    click(container, "requestDelete", "fruits");
    click(container, "cancelDelete", "fruits");
    expect(container.textContent).not.toContain("Delete this snippet?");
    expect(await readStoredNames()).toEqual(["fruits"]);
  });

  test("saves a new snippet", async() => {
    const { container, readStoredNames } = await setup();

    type(queryNameInput(container), "My Fruits");
    type(queryQueryTextarea(container), "apple");
    click(container, "save");
    expect(readNames(container)).toEqual(["my_fruits"]);
    expect(await readStoredNames()).toEqual(["my_fruits"]);
  });

  test("edits an existing snippet", async() => {
    const { container, readStoredNames } = await setup([fruits]);

    click(container, "edit", "fruits");
    expect(container.textContent).toContain("Editing /fruits");
    type(queryNameInput(container), "berries");
    click(container, "save");
    expect(await readStoredNames()).toEqual(["berries"]);
  });

  test("cancels an edit on Escape", async() => {
    const { container } = await setup([fruits]);

    click(container, "edit", "fruits");
    queryNameInput(container).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(container.textContent).toContain("New snippet");
    expect(queryNameInput(container).value).toBe("");
  });

  test("returns to a new snippet when an edit is cancelled", async() => {
    const { container } = await setup([fruits]);

    click(container, "edit", "fruits");
    click(container, "cancelEdit");
    expect(container.textContent).toContain("New snippet");
  });

  test("shows a failed save until the user types again", async() => {
    const { container } = await setup();

    click(container, "save");
    expect(container.textContent).toContain("A snippet needs a name");
    type(queryNameInput(container), "fruits");
    expect(container.textContent).not.toContain("A snippet needs a name");
  });

  test("builds a query from the search results", async() => {
    const { container } = await setup([], ["1", "2"]);

    click(container, "fillQueryFromResults");
    expect(queryQueryTextarea(container).value).toBe("( 1 ~ 2 )");
  });

  test("alerts when there are no search results", async() => {
    const { container, alerts } = await setup();

    click(container, "fillQueryFromResults");
    expect(alerts).toEqual(["No search results to build a query from"]);
  });

  test("replaces the snippets with an imported file's", async() => {
    const { container, actions } = await setup([fruits]);

    vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(function choose(this: HTMLInputElement): void {
      Object.defineProperty(this, "files", { value: [new File([JSON.stringify([{ name: "veg", query: "carrot" }])], "snippets.json")] });
      this.dispatchEvent(new Event("change"));
    });
    actions[0].click();
    await flushMicrotasks();
    expect(readNames(container)).toEqual(["veg"]);
  });

  test("exports the snippets to a json file", async() => {
    const { actions, saved } = await setup([fruits]);

    actions[1].click();
    expect(saved).toEqual(["snippets.json"]);
  });

  test("removes every snippet once delete all is confirmed", async() => {
    const { container, actions, readStoredNames } = await setup([fruits, veg]);

    actions[2].click();
    expect(readNames(container)).toEqual([]);
    expect(await readStoredNames()).toEqual([]);
  });
});
