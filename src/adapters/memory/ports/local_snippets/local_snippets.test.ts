import { describe, expect, test } from "vitest";
import { MemoryLocalSnippets } from "@/adapters/memory/ports/local_snippets/local_snippets";
import { Snippet } from "@/core/domain/snippet/snippet";

function createSnippet(name: string, query = "apple"): Snippet {
  return { name, query, lastUsedAt: 0, createdAt: 0 };
}

describe("MemoryLocalSnippets", () => {
  test("reads back what it wrote", async() => {
    const snippets = new MemoryLocalSnippets();

    await snippets.setMany([createSnippet("fruits"), createSnippet("pets")]);

    expect(await snippets.getAll()).toEqual([createSnippet("fruits"), createSnippet("pets")]);
  });

  test("overwrites a snippet with the same name", async() => {
    const snippets = new MemoryLocalSnippets();

    await snippets.setMany([createSnippet("fruits", "apple")]);
    await snippets.setMany([createSnippet("fruits", "banana")]);

    expect(await snippets.getAll()).toEqual([createSnippet("fruits", "banana")]);
  });

  test("deletes snippets by name", async() => {
    const snippets = new MemoryLocalSnippets();

    await snippets.setMany([createSnippet("fruits"), createSnippet("pets")]);
    await snippets.deleteMany(["fruits", "missing"]);

    expect(await snippets.getAll()).toEqual([createSnippet("pets")]);
  });

  test("replaces every snippet", async() => {
    const snippets = new MemoryLocalSnippets();

    await snippets.setMany([createSnippet("fruits")]);
    await snippets.replaceAll([createSnippet("pets")]);

    expect(await snippets.getAll()).toEqual([createSnippet("pets")]);
  });

  test("is unaffected by mutating a snippet after writing or reading it", async() => {
    const snippets = new MemoryLocalSnippets();
    const written = createSnippet("fruits");

    await snippets.setMany([written]);
    written.query = "changed";
    (await snippets.getAll())[0].query = "changed";

    expect(await snippets.getAll()).toEqual([createSnippet("fruits")]);
  });
});
