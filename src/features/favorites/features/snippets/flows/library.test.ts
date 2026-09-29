import { Snippet, SnippetScene } from "@/features/favorites/features/snippets/types/types";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/types/favorite";
import { MemoryKeyValueStore } from "@/adapters/memory/ports/key_value_store/key_value_store";
import { SnippetFlows } from "@/features/favorites/features/snippets/flows/flows";
import { SnippetLibraryFlow } from "@/features/favorites/features/snippets/flows/library";
import { SnippetModel } from "@/features/favorites/features/snippets/model/model";
import { SnippetShell } from "@/features/favorites/features/snippets/shell/shell";
import { SnippetView } from "@/features/favorites/features/snippets/view/view";
import { createSnippet } from "@/features/favorites/features/snippets/testing/snippets";

const STORAGE_KEY = "searchSnippets";

class FakeView extends SnippetView {
  public readonly mounted: HTMLElement[] = [];
  public readonly scenes: SnippetScene[] = [];
  public name = "";
  public query = "";
  public focused: "name" | "query" | null = null;

  constructor() {
    super(new SnippetShell());
  }

  public mount(container: HTMLElement): void {
    this.mounted.push(container);
  }

  public render(scene: SnippetScene): void {
    this.scenes.push(structuredClone(scene));
  }

  public fill(snippet: Snippet): void {
    this.name = snippet.name;
    this.query = snippet.query;
    this.focused = "name";
  }

  public clear(): void {
    this.name = "";
    this.query = "";
  }

  public setQuery(query: string): void {
    this.query = query;
    this.focused = "query";
  }

  public lastScene(): SnippetScene {
    const scene = this.scenes.at(-1);

    if (scene === undefined) {
      throw new Error("nothing rendered");
    }
    return scene;
  }
}

interface Options {
  snippets?: Snippet[];
  results?: string[];
  confirmed?: boolean;
}

interface Setup {
  library: SnippetLibraryFlow;
  storage: MemoryKeyValueStore;
  view: FakeView;
  appended: string[];
  alerts: string[];
  confirms: string[];
  saved: { blob: Blob; filename: string }[];
}

function setup({ snippets = [], results = [], confirmed = true }: Options = {}): Setup {
  const storage = new MemoryKeyValueStore();
  const view = new FakeView();
  const appended: string[] = [];
  const alerts: string[] = [];
  const confirms: string[] = [];
  const saved: { blob: Blob; filename: string }[] = [];

  storage.set(STORAGE_KEY, snippets);

  const { library } = new SnippetFlows({
    appendToSearch: (text): number => appended.push(text),
    getSearchResults: (): Favorite[] => results.map(id => ({ id }) as Favorite),
    alert: (message): number => alerts.push(message),
    confirm: (message): boolean => confirms.push(message) > 0 && confirmed,
    saveBlob: (blob, filename): number => saved.push({ blob, filename })
  }, new SnippetModel(storage), view);
  return { library, storage, view, appended, alerts, confirms, saved };
}

function namesOf(snippets: Snippet[]): string[] {
  return snippets.map(snippet => snippet.name);
}

function storedNamesOf(storage: MemoryKeyValueStore): string[] {
  return namesOf((storage.get(STORAGE_KEY) as Snippet[] | undefined) ?? []);
}

const fruits = createSnippet("fruits", "( apple ~ banana )", 0, 100);
const veg = createSnippet("veg", "carrot", 0, 200);

describe("mount", () => {
  test("mounts the view and draws the stored snippets", () => {
    const { library, view } = setup({ snippets: [fruits] });
    const container = document.createElement("div");

    library.mount(container);
    expect(view.mounted).toEqual([container]);
    expect(view.lastScene()).toEqual({ rows: [fruits], placeholder: "No matching snippets", editTarget: null, deleteTarget: null, failure: null });
  });

  test("says there are no snippets yet", () => {
    const { library, view } = setup();

    library.mount(document.createElement("div"));
    expect(view.lastScene().placeholder).toBe("No snippets yet");
  });
});

describe("suggestions", () => {
  test("suggests every snippet after the trigger", () => {
    const { library } = setup({ snippets: [fruits] });

    expect(library.suggestions("/fr")).toEqual([{ label: "/fruits (snippet)", value: "/fruits", insert: "( apple ~ banana )", type: "snippet" }]);
  });

  test("suggests nothing without the trigger", () => {
    expect(setup({ snippets: [fruits] }).library.suggestions("fr")).toEqual([]);
  });
});

describe("use", () => {
  test("appends the query to the search and marks the snippet used", () => {
    const { library, appended, view, storage } = setup({ snippets: [fruits] });

    library.use("fruits");
    expect(appended).toEqual(["( apple ~ banana )"]);
    expect(view.lastScene().rows[0].lastUsedAt).toBeGreaterThan(0);
    expect((storage.get(STORAGE_KEY) as Snippet[] | undefined)?.[0].lastUsedAt).toBeGreaterThan(0);
  });

  test("ignores an unknown snippet", () => {
    const { library, appended, view } = setup();

    library.use("missing");
    expect(appended).toEqual([]);
    expect(view.scenes).toEqual([]);
  });
});

describe("moveToTop", () => {
  test("makes the snippet the newest", () => {
    const { library, view } = setup({ snippets: [fruits, veg] });

    library.moveToTop("fruits");
    expect(namesOf(view.lastScene().rows)).toEqual(["fruits", "veg"]);
  });
});

describe("edit", () => {
  test("fills the editor and targets the snippet", () => {
    const { library, view } = setup({ snippets: [fruits] });

    library.requestDelete("fruits");
    library.edit("fruits");
    expect([view.name, view.query, view.focused]).toEqual(["fruits", "( apple ~ banana )", "name"]);
    expect(view.lastScene()).toMatchObject({ editTarget: "fruits", deleteTarget: null, failure: null });
  });

  test("ignores an unknown snippet", () => {
    const { library, view } = setup();

    library.edit("missing");
    expect(view.focused).toBeNull();
    expect(view.scenes).toEqual([]);
  });
});

describe("save", () => {
  test("adds a new snippet and clears the editor", () => {
    const { library, view, storage } = setup();

    view.name = "fruits";
    library.save("fruits", "apple");
    expect(storedNamesOf(storage)).toEqual(["fruits"]);
    expect(namesOf(view.lastScene().rows)).toEqual(["fruits"]);
    expect([view.name, view.query]).toEqual(["", ""]);
  });

  test("updates the snippet being edited", () => {
    const { library, view, storage } = setup({ snippets: [fruits] });

    library.edit("fruits");
    library.save("berries", "apple");
    expect(storedNamesOf(storage)).toEqual(["berries"]);
    expect(view.lastScene()).toMatchObject({ editTarget: null, failure: null });
  });

  test("explains why a save failed and keeps the editor", () => {
    const { library, view } = setup({ snippets: [fruits] });

    view.name = "fruits";
    library.save("fruits", "apple");
    expect(view.lastScene().failure).toEqual({ reason: "duplicate-name", message: "A snippet named /fruits already exists" });
    expect(view.name).toBe("fruits");
  });
});

describe("fillQueryFromResults", () => {
  test("puts an id query in the editor and clears a failure", () => {
    const { library, view } = setup({ results: ["1", "2"] });

    library.save("", "");
    library.fillQueryFromResults();
    expect([view.query, view.focused]).toEqual(["( 1 ~ 2 )", "query"]);
    expect(view.lastScene().failure).toBeNull();
  });

  test("alerts when there are no results", () => {
    const { library, view, alerts } = setup();

    library.fillQueryFromResults();
    expect(alerts).toEqual(["No search results to build a query from"]);
    expect(view.query).toBe("");
  });
});

describe("cancelEdit", () => {
  test("clears the editor and the target", () => {
    const { library, view } = setup({ snippets: [fruits] });

    library.edit("fruits");
    expect(library.cancelEdit()).toBe(true);
    expect(view.name).toBe("");
    expect(view.lastScene().editTarget).toBeNull();
  });

  test("does nothing when no snippet is being edited", () => {
    const { library, view } = setup({ snippets: [fruits] });

    expect(library.cancelEdit()).toBe(false);
    expect(view.scenes).toEqual([]);
  });
});

describe("deleting one", () => {
  test("requestDelete asks to confirm the snippet", () => {
    const { library, view } = setup({ snippets: [fruits] });

    library.requestDelete("fruits");
    expect(view.lastScene().deleteTarget).toBe("fruits");
  });

  test("cancelDelete drops the request", () => {
    const { library, view } = setup({ snippets: [fruits] });

    library.requestDelete("fruits");
    library.cancelDelete();
    expect(view.lastScene().deleteTarget).toBeNull();
  });

  test("delete removes the snippet", () => {
    const { library, view, storage } = setup({ snippets: [fruits, veg] });

    library.requestDelete("fruits");
    library.delete("fruits");
    expect(storedNamesOf(storage)).toEqual(["veg"]);
    expect(view.lastScene()).toMatchObject({ rows: [veg], deleteTarget: null });
  });

  test("delete clears the editor when it held that snippet", () => {
    const { library, view } = setup({ snippets: [fruits] });

    library.edit("fruits");
    library.delete("fruits");
    expect(view.name).toBe("");
    expect(view.lastScene().editTarget).toBeNull();
  });

  test("delete keeps the editor when it held another snippet", () => {
    const { library, view } = setup({ snippets: [fruits, veg] });

    library.edit("veg");
    library.delete("fruits");
    expect(view.name).toBe("veg");
    expect(view.lastScene().editTarget).toBe("veg");
  });
});

describe("deleteAll", () => {
  test("removes every snippet once confirmed", () => {
    const { library, view, confirms, storage } = setup({ snippets: [fruits, veg] });

    library.edit("fruits");
    library.requestDelete("veg");
    library.deleteAll();
    expect(confirms).toEqual(["Delete all 2 snippets?"]);
    expect(storedNamesOf(storage)).toEqual([]);
    expect(view.name).toBe("");
    expect(view.lastScene()).toMatchObject({ rows: [], editTarget: null, deleteTarget: null });
  });

  test("keeps everything when not confirmed", () => {
    const { library, storage } = setup({ snippets: [fruits], confirmed: false });

    library.deleteAll();
    expect(storedNamesOf(storage)).toEqual(["fruits"]);
  });

  test("alerts when there is nothing to delete", () => {
    const { library, alerts, confirms } = setup();

    library.deleteAll();
    expect(alerts).toEqual(["No snippets to delete"]);
    expect(confirms).toEqual([]);
  });
});

describe("clearFailure", () => {
  test("drops a failure and redraws", () => {
    const { library, view } = setup();

    library.save("", "");
    library.clearFailure();
    expect(view.lastScene().failure).toBeNull();
  });

  test("does nothing without a failure", () => {
    const { library, view } = setup();

    library.clearFailure();
    expect(view.scenes).toEqual([]);
  });
});

describe("filter", () => {
  test("draws only the matching snippets", () => {
    const { library, view } = setup({ snippets: [fruits, veg] });

    library.filter("carrot");
    expect(namesOf(view.lastScene().rows)).toEqual(["veg"]);
  });
});

describe("exportToFile", () => {
  test("saves every snippet as json", async() => {
    const { library, saved } = setup({ snippets: [fruits] });

    library.exportToFile();
    expect(saved.map(entry => entry.filename)).toEqual(["snippets.json"]);
    expect(JSON.parse(await saved[0].blob.text())).toEqual([{ name: "fruits", query: "( apple ~ banana )" }]);
  });
});

describe("importFromFile", () => {
  const contents = JSON.stringify([{ name: "veg", query: "carrot" }]);

  test("stores the file's snippets without asking when there are none", () => {
    const { library, confirms, view, storage } = setup();

    library.importFromFile(contents);
    expect(confirms).toEqual([]);
    expect(storedNamesOf(storage)).toEqual(["veg"]);
    expect(namesOf(view.lastScene().rows)).toEqual(["veg"]);
  });

  test("replaces existing snippets once confirmed", () => {
    const { library, view, confirms, storage } = setup({ snippets: [fruits] });

    library.edit("fruits");
    library.importFromFile(contents);
    expect(confirms).toEqual(["Replace all snippets with 1 from this file?"]);
    expect(storedNamesOf(storage)).toEqual(["veg"]);
    expect(view.name).toBe("");
  });

  test("keeps existing snippets when not confirmed", () => {
    const { library, storage } = setup({ snippets: [fruits], confirmed: false });

    library.importFromFile(contents);
    expect(storedNamesOf(storage)).toEqual(["fruits"]);
  });

  test("alerts when the file has no snippets", () => {
    const { library, alerts, storage } = setup({ snippets: [fruits] });

    library.importFromFile("{not json");
    expect(alerts).toEqual(["No snippets found in that file"]);
    expect(storedNamesOf(storage)).toEqual(["fruits"]);
  });
});
