import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryLocalSnippets } from "@/adapters/memory/ports/local_snippets/local_snippets";
import { Snippet } from "@/core/domain/snippet/snippet";
import { SnippetModel } from "@/features/favorites/features/snippets/model/model";
import { createSnippet } from "@/features/favorites/features/snippets/testing/snippets";

interface Setup {
  model: SnippetModel;
  localSnippets: MemoryLocalSnippets;
}

const fruits = createSnippet("fruits", "( apple ~ banana )", { createdAt: 100 });
const veg = createSnippet("veg", "carrot", { createdAt: 200 });

async function setup(snippets: Snippet[] = []): Promise<Setup> {
  const localSnippets = new MemoryLocalSnippets();
  const model = new SnippetModel({ localSnippets, localKeyedValues: new MemoryLocalKeyedValues() });

  await localSnippets.setMany(snippets);
  await model.loadSnippets();
  return { model, localSnippets };
}

function getNames(snippets: Snippet[]): string[] {
  return snippets.map(snippet => snippet.name);
}

async function readStoredNames(localSnippets: MemoryLocalSnippets): Promise<string[]> {
  return getNames(await localSnippets.getAll());
}

describe("SnippetModel", () => {
  test("gets, lists, and counts the stored snippets", async() => {
    const { model } = await setup([fruits, veg]);

    expect(model.getSnippet("fruits")).toEqual(fruits);
    expect(getNames(model.getAllSnippets())).toEqual(["fruits", "veg"]);
    expect(model.countSnippets()).toBe(2);
  });

  test("lists the matching snippets newest first", async() => {
    const { model } = await setup([fruits, veg]);

    expect(getNames(model.listSnippets(""))).toEqual(["veg", "fruits"]);
    expect(getNames(model.listSnippets("carrot"))).toEqual(["veg"]);
  });

  test("describes an empty list", async() => {
    expect((await setup()).model.emptyText()).toBe("No snippets yet");
    expect((await setup([fruits])).model.emptyText()).toBe("No matching snippets");
  });

  test("adds, updates, and removes snippets in storage", async() => {
    const { model, localSnippets } = await setup();

    expect(model.addSnippet("fruits", "apple").ok).toBe(true);
    expect(model.updateSnippet("fruits", "berries", "apple").ok).toBe(true);
    expect(await readStoredNames(localSnippets)).toEqual(["berries"]);
    model.removeSnippet("berries");
    expect(await readStoredNames(localSnippets)).toEqual([]);
  });

  test("marks a snippet used and moves one to the top", async() => {
    const { model } = await setup([fruits, veg]);

    model.useSnippet("fruits");
    model.moveSnippetToTop("fruits");
    expect(model.getSnippet("fruits")?.lastUsedAt).toBeGreaterThan(0);
    expect(getNames(model.listSnippets(""))).toEqual(["fruits", "veg"]);
  });

  test("replaces every snippet", async() => {
    const { model, localSnippets } = await setup([fruits]);

    expect(model.replaceAllSnippets([{ name: "veg", query: "carrot" }])).toBe(1);
    expect(await readStoredNames(localSnippets)).toEqual(["veg"]);
  });

  test("describes a failure", async() => {
    expect((await setup()).model.describeFailure("duplicate-name", "fruits")).toBe("A snippet named /fruits already exists");
  });

  test("builds an id query", async() => {
    expect((await setup()).model.buildIdQuery(["1", "2"])).toBe("( 1 ~ 2 )");
  });

  test("round-trips the snippets through a file", async() => {
    const { model } = await setup([fruits]);
    const contents = await model.serializeSnippets().text();

    expect(model.parseSnippets(contents)).toEqual([{ name: "fruits", query: "( apple ~ banana )" }]);
  });
});
