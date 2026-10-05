import { describe, expect, test } from "vitest";
import { Favorite } from "@/types/favorite";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryLocalSnippets } from "@/adapters/memory/ports/local_snippets/local_snippets";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Snippet } from "@/core/domain/snippet/snippet";
import { SnippetFlows } from "@/features/favorites/features/snippets/flows/flows";
import { SnippetLibraryFlow } from "@/features/favorites/features/snippets/flows/library";
import { SnippetModel } from "@/features/favorites/features/snippets/model/model";
import { SnippetScene } from "@/features/favorites/features/snippets/types/types";
import { SnippetShell } from "@/features/favorites/features/snippets/shell/shell";
import { SnippetView } from "@/features/favorites/features/snippets/view/view";
import { createSnippet } from "@/features/favorites/features/snippets/testing/snippets";

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
  localSnippets: MemoryLocalSnippets;
  view: FakeView;
  appended: string[];
  alerts: string[];
  confirms: string[];
  saved: { blob: Blob; filename: string }[];
}

async function setup({ snippets = [], results = [], confirmed = true }: Options = {}): Promise<Setup> {
  const localSnippets = new MemoryLocalSnippets();
  const model = new SnippetModel({ localSnippets, localKeyedValues: new MemoryLocalKeyedValues(), scheduler: new MemoryScheduler(1_000) });
  const view = new FakeView();
  const appended: string[] = [];
  const alerts: string[] = [];
  const confirms: string[] = [];
  const saved: { blob: Blob; filename: string }[] = [];

  await localSnippets.setMany(snippets);
  await model.loadSnippets();

  const { library } = new SnippetFlows({
    appendToSearch: (text): number => appended.push(text),
    getSearchResults: (): Favorite[] => results.map(id => ({ id }) as Favorite),
    alert: (message): number => alerts.push(message),
    confirm: (message): boolean => confirms.push(message) > 0 && confirmed,
    saveBlob: (blob, filename): number => saved.push({ blob, filename })
  }, model, view);
  return { library, localSnippets, view, appended, alerts, confirms, saved };
}

function getNames(snippets: Snippet[]): string[] {
  return snippets.map(snippet => snippet.name);
}

async function readStoredNames(localSnippets: MemoryLocalSnippets): Promise<string[]> {
  return getNames(await localSnippets.getAll());
}

const fruits = createSnippet("fruits", "( apple ~ banana )", { createdAt: 100 });
const veg = createSnippet("veg", "carrot", { createdAt: 200 });

describe("SnippetLibraryFlow", () => {
  describe("mount", () => {
    test("mounts the view and draws the stored snippets", async() => {
      const { library, view } = await setup({ snippets: [fruits] });
      const container = document.createElement("div");

      library.mount(container);
      expect(view.mounted).toEqual([container]);
      expect(view.lastScene()).toEqual({ rows: [fruits], placeholder: "No matching snippets", editTarget: null, deleteTarget: null, failure: null });
    });

    test("says there are no snippets yet", async() => {
      const { library, view } = await setup();

      library.mount(document.createElement("div"));
      expect(view.lastScene().placeholder).toBe("No snippets yet");
    });
  });

  describe("load", () => {
    test("draws the snippets once they load", async() => {
      const localSnippets = new MemoryLocalSnippets();
      const view = new FakeView();
      const { library } = new SnippetFlows({
        appendToSearch: (): void => undefined,
        getSearchResults: (): Favorite[] => [],
        alert: (): void => undefined,
        confirm: (): boolean => true,
        saveBlob: (): void => undefined
      }, new SnippetModel({ localSnippets, localKeyedValues: new MemoryLocalKeyedValues(), scheduler: new MemoryScheduler(1_000) }), view);

      await localSnippets.setMany([fruits]);
      await library.load();
      expect(view.lastScene().rows).toEqual([fruits]);
    });
  });

  describe("suggestions", () => {
    test("suggests every snippet after the trigger", async() => {
      const { library } = await setup({ snippets: [fruits] });

      expect(library.suggestions("/fr")).toEqual([{ label: "/fruits (snippet)", value: "/fruits", insert: "( apple ~ banana )", type: "snippet" }]);
    });

    test("suggests nothing without the trigger", async() => {
      expect((await setup({ snippets: [fruits] })).library.suggestions("fr")).toEqual([]);
    });
  });

  describe("use", () => {
    test("appends the query to the search and marks the snippet used", async() => {
      const { library, appended, view, localSnippets } = await setup({ snippets: [fruits] });

      library.use("fruits");
      expect(appended).toEqual(["( apple ~ banana )"]);
      expect(view.lastScene().rows[0].lastUsedAt).toBe(1_000);
      expect((await localSnippets.getAll())[0].lastUsedAt).toBe(1_000);
    });

    test("ignores an unknown snippet", async() => {
      const { library, appended, view } = await setup();

      library.use("missing");
      expect(appended).toEqual([]);
      expect(view.scenes).toEqual([]);
    });
  });

  describe("moveToTop", () => {
    test("makes the snippet the newest", async() => {
      const { library, view } = await setup({ snippets: [fruits, veg] });

      library.moveToTop("fruits");
      expect(getNames(view.lastScene().rows)).toEqual(["fruits", "veg"]);
    });
  });

  describe("edit", () => {
    test("fills the editor and targets the snippet", async() => {
      const { library, view } = await setup({ snippets: [fruits] });

      library.requestDelete("fruits");
      library.edit("fruits");
      expect([view.name, view.query, view.focused]).toEqual(["fruits", "( apple ~ banana )", "name"]);
      expect(view.lastScene()).toMatchObject({ editTarget: "fruits", deleteTarget: null, failure: null });
    });

    test("ignores an unknown snippet", async() => {
      const { library, view } = await setup();

      library.edit("missing");
      expect(view.focused).toBeNull();
      expect(view.scenes).toEqual([]);
    });
  });

  describe("save", () => {
    test("adds a new snippet and clears the editor", async() => {
      const { library, view, localSnippets } = await setup();

      view.name = "fruits";
      library.save("fruits", "apple");
      expect(await readStoredNames(localSnippets)).toEqual(["fruits"]);
      expect(getNames(view.lastScene().rows)).toEqual(["fruits"]);
      expect([view.name, view.query]).toEqual(["", ""]);
    });

    test("updates the snippet being edited", async() => {
      const { library, view, localSnippets } = await setup({ snippets: [fruits] });

      library.edit("fruits");
      library.save("berries", "apple");
      expect(await readStoredNames(localSnippets)).toEqual(["berries"]);
      expect(view.lastScene()).toMatchObject({ editTarget: null, failure: null });
    });

    test("explains why a save failed and keeps the editor", async() => {
      const { library, view } = await setup({ snippets: [fruits] });

      view.name = "fruits";
      library.save("fruits", "apple");
      expect(view.lastScene().failure).toEqual({ reason: "duplicate-name", message: "A snippet named /fruits already exists" });
      expect(view.name).toBe("fruits");
    });
  });

  describe("fillQueryFromResults", () => {
    test("puts an id query in the editor and clears a failure", async() => {
      const { library, view } = await setup({ results: ["1", "2"] });

      library.save("", "");
      library.fillQueryFromResults();
      expect([view.query, view.focused]).toEqual(["( 1 ~ 2 )", "query"]);
      expect(view.lastScene().failure).toBeNull();
    });

    test("alerts when there are no results", async() => {
      const { library, view, alerts } = await setup();

      library.fillQueryFromResults();
      expect(alerts).toEqual(["No search results to build a query from"]);
      expect(view.query).toBe("");
    });
  });

  describe("cancelEdit", () => {
    test("clears the editor and the target", async() => {
      const { library, view } = await setup({ snippets: [fruits] });

      library.edit("fruits");
      expect(library.cancelEdit()).toBe(true);
      expect(view.name).toBe("");
      expect(view.lastScene().editTarget).toBeNull();
    });

    test("does nothing when no snippet is being edited", async() => {
      const { library, view } = await setup({ snippets: [fruits] });

      expect(library.cancelEdit()).toBe(false);
      expect(view.scenes).toEqual([]);
    });
  });

  describe("requestDelete", () => {
    test("asks to confirm the snippet", async() => {
      const { library, view } = await setup({ snippets: [fruits] });

      library.requestDelete("fruits");
      expect(view.lastScene().deleteTarget).toBe("fruits");
    });
  });

  describe("cancelDelete", () => {
    test("drops the request", async() => {
      const { library, view } = await setup({ snippets: [fruits] });

      library.requestDelete("fruits");
      library.cancelDelete();
      expect(view.lastScene().deleteTarget).toBeNull();
    });
  });

  describe("delete", () => {
    test("removes the snippet", async() => {
      const { library, view, localSnippets } = await setup({ snippets: [fruits, veg] });

      library.requestDelete("fruits");
      library.delete("fruits");
      expect(await readStoredNames(localSnippets)).toEqual(["veg"]);
      expect(view.lastScene()).toMatchObject({ rows: [veg], deleteTarget: null });
    });

    test("clears the editor when it held that snippet", async() => {
      const { library, view } = await setup({ snippets: [fruits] });

      library.edit("fruits");
      library.delete("fruits");
      expect(view.name).toBe("");
      expect(view.lastScene().editTarget).toBeNull();
    });

    test("keeps the editor when it held another snippet", async() => {
      const { library, view } = await setup({ snippets: [fruits, veg] });

      library.edit("veg");
      library.delete("fruits");
      expect(view.name).toBe("veg");
      expect(view.lastScene().editTarget).toBe("veg");
    });
  });

  describe("deleteAll", () => {
    test("removes every snippet once confirmed", async() => {
      const { library, view, confirms, localSnippets } = await setup({ snippets: [fruits, veg] });

      library.edit("fruits");
      library.requestDelete("veg");
      library.deleteAll();
      expect(confirms).toEqual(["Delete all 2 snippets?"]);
      expect(await readStoredNames(localSnippets)).toEqual([]);
      expect(view.name).toBe("");
      expect(view.lastScene()).toMatchObject({ rows: [], editTarget: null, deleteTarget: null });
    });

    test("keeps everything when not confirmed", async() => {
      const { library, localSnippets } = await setup({ snippets: [fruits], confirmed: false });

      library.deleteAll();
      expect(await readStoredNames(localSnippets)).toEqual(["fruits"]);
    });

    test("alerts when there is nothing to delete", async() => {
      const { library, alerts, confirms } = await setup();

      library.deleteAll();
      expect(alerts).toEqual(["No snippets to delete"]);
      expect(confirms).toEqual([]);
    });
  });

  describe("clearFailure", () => {
    test("drops a failure and redraws", async() => {
      const { library, view } = await setup();

      library.save("", "");
      library.clearFailure();
      expect(view.lastScene().failure).toBeNull();
    });

    test("does nothing without a failure", async() => {
      const { library, view } = await setup();

      library.clearFailure();
      expect(view.scenes).toEqual([]);
    });
  });

  describe("filter", () => {
    test("draws only the matching snippets", async() => {
      const { library, view } = await setup({ snippets: [fruits, veg] });

      library.filter("carrot");
      expect(getNames(view.lastScene().rows)).toEqual(["veg"]);
    });
  });

  describe("exportToFile", () => {
    test("saves every snippet as json", async() => {
      const { library, saved } = await setup({ snippets: [fruits] });

      library.exportToFile();
      expect(saved.map(entry => entry.filename)).toEqual(["snippets.json"]);
      expect(JSON.parse(await saved[0].blob.text())).toEqual([{ name: "fruits", query: "( apple ~ banana )" }]);
    });
  });

  describe("importFromFile", () => {
    const contents = JSON.stringify([{ name: "veg", query: "carrot" }]);

    test("stores the file's snippets without asking when there are none", async() => {
      const { library, confirms, view, localSnippets } = await setup();

      library.importFromFile(contents);
      expect(confirms).toEqual([]);
      expect(await readStoredNames(localSnippets)).toEqual(["veg"]);
      expect(getNames(view.lastScene().rows)).toEqual(["veg"]);
    });

    test("replaces existing snippets once confirmed", async() => {
      const { library, view, confirms, localSnippets } = await setup({ snippets: [fruits] });

      library.edit("fruits");
      library.importFromFile(contents);
      expect(confirms).toEqual(["Replace all snippets with 1 from this file?"]);
      expect(await readStoredNames(localSnippets)).toEqual(["veg"]);
      expect(view.name).toBe("");
    });

    test("keeps existing snippets when not confirmed", async() => {
      const { library, localSnippets } = await setup({ snippets: [fruits], confirmed: false });

      library.importFromFile(contents);
      expect(await readStoredNames(localSnippets)).toEqual(["fruits"]);
    });

    test("alerts when the file has no snippets", async() => {
      const { library, alerts, localSnippets } = await setup({ snippets: [fruits] });

      library.importFromFile("{not json");
      expect(alerts).toEqual(["No snippets found in that file"]);
      expect(await readStoredNames(localSnippets)).toEqual(["fruits"]);
    });
  });
});
