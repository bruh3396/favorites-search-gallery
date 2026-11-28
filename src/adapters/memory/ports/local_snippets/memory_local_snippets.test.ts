import { describe, expect, test } from "vitest";
import { MemoryLocalSnippets } from "@/adapters/memory/ports/local_snippets/memory_local_snippets";
import { createSnippet } from "@/testing/snippet";

describe("MemoryLocalSnippets", () => {
  test("reads back what it wrote", async() => {
    const localSnippets = new MemoryLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits" }));
    await localSnippets.set(createSnippet({ name: "pets" }));

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "fruits" }), createSnippet({ name: "pets" })]);
  });

  test("overwrites a snippet with the same name", async() => {
    const localSnippets = new MemoryLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits", query: "apple" }));
    await localSnippets.set(createSnippet({ name: "fruits", query: "banana" }));

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "fruits", query: "banana" })]);
  });

  test("renames a snippet, dropping its previous name", async() => {
    const localSnippets = new MemoryLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits" }));
    await localSnippets.set(createSnippet({ name: "pets" }));
    await localSnippets.rename("fruits", createSnippet({ name: "produce", query: "banana" }));

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "pets" }), createSnippet({ name: "produce", query: "banana" })]);
  });

  test("renames a snippet when only its case changes", async() => {
    const localSnippets = new MemoryLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits" }));
    await localSnippets.rename("fruits", createSnippet({ name: "Fruits" }));

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "Fruits" })]);
  });

  test("keeps a snippet renamed to its own name", async() => {
    const localSnippets = new MemoryLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits", query: "apple" }));
    await localSnippets.rename("fruits", createSnippet({ name: "fruits", query: "banana" }));

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "fruits", query: "banana" })]);
  });

  test("deletes a snippet by name", async() => {
    const localSnippets = new MemoryLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits" }));
    await localSnippets.set(createSnippet({ name: "pets" }));
    await localSnippets.delete("fruits");
    await localSnippets.delete("missing");

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "pets" })]);
  });

  test("keeps its copy when a written or read snippet is mutated", async() => {
    const localSnippets = new MemoryLocalSnippets();
    const writtenSnippet = createSnippet({ name: "fruits" });

    await localSnippets.set(writtenSnippet);
    Object.assign(writtenSnippet, { query: "changed" });
    Object.assign((await localSnippets.getAll())[0], { query: "changed" });

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "fruits" })]);
  });
});
