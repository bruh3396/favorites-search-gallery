import { describe, expect, test } from "vitest";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";

describe("MemoryLocalFavorites", () => {
  test("keeps the newest ids first", async() => {
    const favorites = new MemoryLocalFavorites();

    await favorites.prepend(["2", "1"]);
    await favorites.prepend(["4", "3"]);

    expect(await favorites.getAll()).toEqual(["4", "3", "2", "1"]);
  });

  test("moves an id it already holds to the front", async() => {
    const favorites = new MemoryLocalFavorites();

    await favorites.prepend(["3", "2", "1"]);
    await favorites.prepend(["1"]);

    expect(await favorites.getAll()).toEqual(["1", "3", "2"]);
  });

  test("keeps one copy of an id given twice in one call", async() => {
    const favorites = new MemoryLocalFavorites();

    await favorites.prepend(["2", "1", "2"]);

    expect(await favorites.getAll()).toEqual(["2", "1"]);
  });

  test("removes one id and clears them all", async() => {
    const favorites = new MemoryLocalFavorites();

    await favorites.prepend(["3", "2", "1"]);
    await favorites.remove("2");

    expect(await favorites.getAll()).toEqual(["3", "1"]);
    await favorites.clear();
    expect(await favorites.getAll()).toEqual([]);
  });

  test("a caller mutating what it read never changes what is stored", async() => {
    const favorites = new MemoryLocalFavorites();

    await favorites.prepend(["1"]);
    (await favorites.getAll()).push("2");

    expect(await favorites.getAll()).toEqual(["1"]);
  });
});