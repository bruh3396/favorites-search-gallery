import { describe, expect, test } from "vitest";
import { MemoryLocalSnippets } from "@/adapters/memory/ports/local_snippets/memory_local_snippets";
import { Snippet } from "@/core/domain/snippet/snippet";

function createSnippet(name: string, query = "apple"): Snippet {
  return { name, query, lastUsedAt: 0, createdAt: 0 };
}

describe("MemoryLocalSnippets", () => {
  test("reads back what it wrote", async() => {
    const localSnippets = new MemoryLocalSnippets();

    await localSnippets.setMany([createSnippet("fruits"), createSnippet("pets")]);

    expect(await localSnippets.getAll()).toEqual([createSnippet("fruits"), createSnippet("pets")]);
  });

  test("overwrites a snippet with the same name", async() => {
    const localSnippets = new MemoryLocalSnippets();

    await localSnippets.setMany([createSnippet("fruits", "apple")]);
    await localSnippets.setMany([createSnippet("fruits", "banana")]);

    expect(await localSnippets.getAll()).toEqual([createSnippet("fruits", "banana")]);
  });

  test("deletes snippets by name", async() => {
    const localSnippets = new MemoryLocalSnippets();

    await localSnippets.setMany([createSnippet("fruits"), createSnippet("pets")]);
    await localSnippets.deleteMany(["fruits", "missing"]);

    expect(await localSnippets.getAll()).toEqual([createSnippet("pets")]);
  });

  test("replaces every snippet", async() => {
    const localSnippets = new MemoryLocalSnippets();

    await localSnippets.setMany([createSnippet("fruits")]);
    await localSnippets.replaceAll([createSnippet("pets")]);

    expect(await localSnippets.getAll()).toEqual([createSnippet("pets")]);
  });

  test("keeps its copy when a written or read snippet is mutated", async() => {
    const localSnippets = new MemoryLocalSnippets();
    const writtenSnippet = createSnippet("fruits");

    await localSnippets.setMany([writtenSnippet]);
    Object.assign(writtenSnippet, { query: "changed" });
    Object.assign((await localSnippets.getAll())[0], { query: "changed" });

    expect(await localSnippets.getAll()).toEqual([createSnippet("fruits")]);
  });
});
