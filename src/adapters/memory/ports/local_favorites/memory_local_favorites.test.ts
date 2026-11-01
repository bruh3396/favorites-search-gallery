import { describe, expect, test } from "vitest";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/memory_local_favorites";

describe("MemoryLocalFavorites", () => {
  test("keeps the newest ids first", async() => {
    const localFavorites = new MemoryLocalFavorites();

    await localFavorites.prepend(["2", "1"]);
    await localFavorites.prepend(["4", "3"]);

    expect(await localFavorites.getAll()).toEqual(["4", "3", "2", "1"]);
  });

  test("replaces every id it holds when setting all", async() => {
    const localFavorites = new MemoryLocalFavorites();

    await localFavorites.prepend(["2", "1"]);
    await localFavorites.setAll(["4", "3"]);

    expect(await localFavorites.getAll()).toEqual(["4", "3"]);
  });

  test("moves an id it already holds to the front", async() => {
    const localFavorites = new MemoryLocalFavorites();

    await localFavorites.prepend(["3", "2", "1"]);
    await localFavorites.prepend(["1"]);

    expect(await localFavorites.getAll()).toEqual(["1", "3", "2"]);
  });

  test("keeps one copy of an id given twice in one call", async() => {
    const localFavorites = new MemoryLocalFavorites();

    await localFavorites.prepend(["2", "1", "2"]);

    expect(await localFavorites.getAll()).toEqual(["2", "1"]);
  });

  test("removes the given ids and keeps the rest in order", async() => {
    const localFavorites = new MemoryLocalFavorites();

    await localFavorites.prepend(["4", "3", "2", "1"]);
    await localFavorites.remove(["3", "1"]);

    expect(await localFavorites.getAll()).toEqual(["4", "2"]);
  });

  test("keeps what is stored when a caller mutates what it read", async() => {
    const localFavorites = new MemoryLocalFavorites();

    await localFavorites.prepend(["1"]);
    (await localFavorites.getAll() as string[]).push("2");

    expect(await localFavorites.getAll()).toEqual(["1"]);
  });
});
