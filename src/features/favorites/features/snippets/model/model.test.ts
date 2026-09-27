import { describe, expect, test } from "vitest";
import { Snippet } from "@/features/favorites/features/snippets/types/types";
import { SnippetModel } from "@/features/favorites/features/snippets/model/model";
import { Store } from "@/lib/storage/local_storage";
import { createSnippet } from "@/features/favorites/features/snippets/testing/snippets";

const STORAGE_KEY = "searchSnippets";

class FakeStorage implements Store {
  private readonly values = new Map<string, unknown>();

  public get<V>(key: string): V | null {
    return this.values.has(key) ? this.values.get(key) as V : null;
  }

  public set<V>(key: string, value: V): void {
    this.values.set(key, JSON.parse(JSON.stringify(value)) as unknown);
  }

  public remove(key: string): void {
    this.values.delete(key);
  }

  public keys(): string[] {
    return Array.from(this.values.keys());
  }

  public clear(): void {
    this.values.clear();
  }
}

interface Setup {
  model: SnippetModel;
  storage: FakeStorage;
}

const fruits = createSnippet("fruits", "( apple ~ banana )", 0, 100);
const veg = createSnippet("veg", "carrot", 0, 200);

function setup(snippets: Snippet[] = []): Setup {
  const storage = new FakeStorage();

  storage.set(STORAGE_KEY, snippets);
  return { model: new SnippetModel(storage), storage };
}

function namesOf(snippets: Snippet[]): string[] {
  return snippets.map(snippet => snippet.name);
}

function storedNamesOf(storage: FakeStorage): string[] {
  return namesOf(storage.get<Snippet[]>(STORAGE_KEY) ?? []);
}

describe("reading", () => {
  test("gets, lists, and counts the stored snippets", () => {
    const { model } = setup([fruits, veg]);

    expect(model.getSnippet("fruits")).toEqual(fruits);
    expect(namesOf(model.getAllSnippets())).toEqual(["fruits", "veg"]);
    expect(model.countSnippets()).toBe(2);
  });

  test("lists the matching snippets newest first", () => {
    const { model } = setup([fruits, veg]);

    expect(namesOf(model.listSnippets(""))).toEqual(["veg", "fruits"]);
    expect(namesOf(model.listSnippets("carrot"))).toEqual(["veg"]);
  });

  test("describes an empty list", () => {
    expect(setup().model.emptyText()).toBe("No snippets yet");
    expect(setup([fruits]).model.emptyText()).toBe("No matching snippets");
  });
});

describe("writing", () => {
  test("adds, updates, and removes snippets in storage", () => {
    const { model, storage } = setup();

    expect(model.addSnippet("fruits", "apple").ok).toBe(true);
    expect(model.updateSnippet("fruits", "berries", "apple").ok).toBe(true);
    expect(storedNamesOf(storage)).toEqual(["berries"]);
    model.removeSnippet("berries");
    expect(storedNamesOf(storage)).toEqual([]);
  });

  test("marks a snippet used and moves one to the top", () => {
    const { model } = setup([fruits, veg]);

    model.useSnippet("fruits");
    model.moveSnippetToTop("fruits");
    expect(model.getSnippet("fruits")?.lastUsedAt).toBeGreaterThan(0);
    expect(namesOf(model.listSnippets(""))).toEqual(["fruits", "veg"]);
  });

  test("replaces every snippet", () => {
    const { model, storage } = setup([fruits]);

    expect(model.replaceAllSnippets([{ name: "veg", query: "carrot" }])).toBe(1);
    expect(storedNamesOf(storage)).toEqual(["veg"]);
  });
});

describe("text", () => {
  test("describes a failure", () => {
    expect(setup().model.describeFailure("duplicate-name", "fruits")).toBe("A snippet named /fruits already exists");
  });

  test("builds an id query", () => {
    expect(setup().model.buildIdQuery(["1", "2"])).toBe("( 1 ~ 2 )");
  });

  test("round-trips the snippets through a file", async() => {
    const { model } = setup([fruits]);
    const contents = await model.serializeSnippets().text();

    expect(model.parseSnippets(contents)).toEqual([{ name: "fruits", query: "( apple ~ banana )" }]);
  });
});
