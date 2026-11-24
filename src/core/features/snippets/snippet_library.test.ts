import { describe, expect, test } from "vitest";
import { MemoryLocalSnippets } from "@/adapters/memory/ports/local_snippets/memory_local_snippets";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Snippet } from "@/core/domain/snippet/snippet";
import { SnippetLibrary } from "@/core/features/snippets/snippet_library";
import { createSnippet } from "@/testing/snippet";

const START_TIME = 1_000;

async function setup(storedSnippets: readonly Snippet[] = []): Promise<{
  snippetLibrary: SnippetLibrary;
  localSnippets: MemoryLocalSnippets;
  scheduler: MemoryScheduler;
}> {
  const localSnippets = new MemoryLocalSnippets();
  const scheduler = new MemoryScheduler(START_TIME);
  const snippetLibrary = new SnippetLibrary({ localSnippets, scheduler });

  await localSnippets.replaceAll(storedSnippets);
  await snippetLibrary.load();
  return { snippetLibrary, localSnippets, scheduler };
}

function getListedNames(snippetLibrary: SnippetLibrary): string[] {
  return snippetLibrary.snippets.value.map(snippet => snippet.name);
}

async function getStoredSnippets(localSnippets: MemoryLocalSnippets): Promise<Snippet[]> {
  return [...await localSnippets.getAll()].sort((a, b) => a.name.localeCompare(b.name));
}

describe("SnippetLibrary", () => {
  describe("load", () => {
    test("lists stored snippets A to Z, ignoring case", async() => {
      const { snippetLibrary } = await setup([createSnippet({ name: "pets" }), createSnippet({ name: "Fruits" }), createSnippet({ name: "apples" })]);

      expect(getListedNames(snippetLibrary)).toEqual(["apples", "Fruits", "pets"]);
    });
  });

  describe("isNameTaken", () => {
    test("finds a name whatever its case and surrounding spaces", async() => {
      const { snippetLibrary } = await setup([createSnippet({ name: "no ai" })]);

      expect(snippetLibrary.isNameTaken(" No AI ")).toBe(true);
    });

    test("leaves a new name free", async() => {
      const { snippetLibrary } = await setup([createSnippet({ name: "no ai" })]);

      expect(snippetLibrary.isNameTaken("landscape hq")).toBe(false);
    });

    test("does not count the snippet being edited", async() => {
      const { snippetLibrary } = await setup([createSnippet({ name: "no ai" })]);

      expect(snippetLibrary.isNameTaken("No AI", "no ai")).toBe(false);
    });

    test("counts another snippet while one is being edited", async() => {
      const { snippetLibrary } = await setup([createSnippet({ name: "no ai" }), createSnippet({ name: "landscape hq" })]);

      expect(snippetLibrary.isNameTaken("Landscape HQ", "no ai")).toBe(true);
    });
  });

  describe("save", () => {
    test("adds a new snippet with a trimmed name, stamped with the current time", async() => {
      const { snippetLibrary, localSnippets } = await setup();
      const savedSnippet = createSnippet({ name: "no ai", query: "-ai_generated", lastUsedAt: START_TIME, createdAt: START_TIME });

      await snippetLibrary.save({ name: "  no ai  ", query: "-ai_generated" });

      expect(snippetLibrary.snippets.value).toEqual([savedSnippet]);
      expect(await getStoredSnippets(localSnippets)).toEqual([savedSnippet]);
    });

    test("lists the snippet before storage finishes", async() => {
      const { snippetLibrary } = await setup();

      const saving = snippetLibrary.save({ name: "no ai", query: "-ai_generated" });

      expect(getListedNames(snippetLibrary)).toEqual(["no ai"]);
      await saving;
    });

    test("keeps the list A to Z", async() => {
      const { snippetLibrary } = await setup([createSnippet({ name: "apples" }), createSnippet({ name: "pets" })]);

      await snippetLibrary.save({ name: "Fruits", query: "banana" });

      expect(getListedNames(snippetLibrary)).toEqual(["apples", "Fruits", "pets"]);
    });

    test("ignores an empty name", async() => {
      const { snippetLibrary, localSnippets } = await setup();

      await snippetLibrary.save({ name: "   ", query: "apple" });

      expect(snippetLibrary.snippets.value).toEqual([]);
      expect(await localSnippets.getAll()).toEqual([]);
    });

    test("ignores a name another snippet has, whatever its case", async() => {
      const storedSnippet = createSnippet({ name: "no ai", query: "-ai_generated" });
      const { snippetLibrary, localSnippets } = await setup([storedSnippet]);

      await snippetLibrary.save({ name: "No AI", query: "apple" });

      expect(snippetLibrary.snippets.value).toEqual([storedSnippet]);
      expect(await localSnippets.getAll()).toEqual([storedSnippet]);
    });

    test("changes a query, keeping the snippet's times", async() => {
      const { snippetLibrary, localSnippets, scheduler } = await setup([createSnippet({ name: "fruits", query: "apple", lastUsedAt: 10, createdAt: 5 })]);
      const savedSnippet = createSnippet({ name: "fruits", query: "banana", lastUsedAt: 10, createdAt: 5 });

      scheduler.advance(500);
      await snippetLibrary.save({ name: "fruits", query: "banana" }, "fruits");

      expect(snippetLibrary.snippets.value).toEqual([savedSnippet]);
      expect(await getStoredSnippets(localSnippets)).toEqual([savedSnippet]);
    });

    test("renames a snippet, dropping its previous name", async() => {
      const { snippetLibrary, localSnippets } = await setup([createSnippet({ name: "fruits", createdAt: 5 }), createSnippet({ name: "pets" })]);
      const savedSnippet = createSnippet({ name: "produce", query: "banana", createdAt: 5 });

      await snippetLibrary.save({ name: "produce", query: "banana" }, "fruits");

      expect(snippetLibrary.snippets.value).toEqual([createSnippet({ name: "pets" }), savedSnippet]);
      expect(await getStoredSnippets(localSnippets)).toEqual([createSnippet({ name: "pets" }), savedSnippet]);
    });

    test("renames a snippet when only its case changes", async() => {
      const { snippetLibrary, localSnippets } = await setup([createSnippet({ name: "no ai" })]);

      await snippetLibrary.save({ name: "No AI", query: "apple" }, "no ai");

      expect(getListedNames(snippetLibrary)).toEqual(["No AI"]);
      expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "No AI" })]);
    });
  });

  describe("delete", () => {
    test("removes a snippet from the list and storage", async() => {
      const { snippetLibrary, localSnippets } = await setup([createSnippet({ name: "fruits" }), createSnippet({ name: "pets" })]);

      await snippetLibrary.delete("fruits");

      expect(getListedNames(snippetLibrary)).toEqual(["pets"]);
      expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "pets" })]);
    });
  });

  describe("recordUse", () => {
    test("stamps only that snippet's last use with the current time", async() => {
      const storedSnippet = createSnippet({ name: "pets", lastUsedAt: 10 });
      const { snippetLibrary, localSnippets } = await setup([createSnippet({ name: "fruits", lastUsedAt: 10 }), storedSnippet]);
      const usedSnippet = createSnippet({ name: "fruits", lastUsedAt: START_TIME });

      await snippetLibrary.recordUse("fruits");

      expect(snippetLibrary.snippets.value).toEqual([usedSnippet, storedSnippet]);
      expect(await getStoredSnippets(localSnippets)).toEqual([usedSnippet, storedSnippet]);
    });

    test("ignores a name no snippet has", async() => {
      const storedSnippet = createSnippet({ name: "fruits", lastUsedAt: 10 });
      const { snippetLibrary, localSnippets } = await setup([storedSnippet]);

      await snippetLibrary.recordUse("pets");

      expect(snippetLibrary.snippets.value).toEqual([storedSnippet]);
      expect(await localSnippets.getAll()).toEqual([storedSnippet]);
    });
  });

  describe("replaceAll", () => {
    test("replaces every snippet, listed A to Z", async() => {
      const { snippetLibrary, localSnippets } = await setup([createSnippet({ name: "fruits" })]);

      await snippetLibrary.replaceAll([createSnippet({ name: "pets" }), createSnippet({ name: "apples" })]);

      expect(getListedNames(snippetLibrary)).toEqual(["apples", "pets"]);
      expect(await getStoredSnippets(localSnippets)).toEqual([createSnippet({ name: "apples" }), createSnippet({ name: "pets" })]);
    });

    test("keeps the first snippet of names that differ only in case", async() => {
      const { snippetLibrary, localSnippets } = await setup();
      const firstSnippet = createSnippet({ name: "no ai", query: "-ai_generated" });

      await snippetLibrary.replaceAll([firstSnippet, createSnippet({ name: "No AI", query: "apple" })]);

      expect(snippetLibrary.snippets.value).toEqual([firstSnippet]);
      expect(await localSnippets.getAll()).toEqual([firstSnippet]);
    });
  });
});
