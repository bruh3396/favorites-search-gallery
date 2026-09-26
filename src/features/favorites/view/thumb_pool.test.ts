import { beforeEach, describe, expect, test } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesThumbPool } from "@/features/favorites/view/thumb_pool";
import { ThumbOperations } from "@/features/favorites/types/types";

interface FakeNode {
  serial: number;
  id: string;
  favorited: boolean;
  blanked: boolean;
}

const LARGE_RETAINED = 10_000;

describe("FavoritesThumbPool", () => {
  let created: FakeNode[];
  let ops: ThumbOperations<FakeNode>;
  let pool: FavoritesThumbPool<FakeNode>;

  beforeEach(() => {
    created = [];
    ops = {
      create: (): FakeNode => {
        const node: FakeNode = { serial: created.length, id: "", favorited: false, blanked: false };

        created.push(node);
        return node;
      },
      bind: (node, favorite, favorited): void => {
        node.id = favorite.id;
        node.favorited = favorited;
        node.blanked = false;
      },
      setAsFavorited: (node, favorited): void => {
        node.favorited = favorited;
      },
      blankImage: (node): void => {
        node.blanked = true;
      }
    };
    pool = new FavoritesThumbPool(ops, LARGE_RETAINED, false);
  });

  describe("resolve", () => {
    test("binds a page and returns exactly that many nodes", () => {
      const nodes = pool.resolve(createFavorites("1", "2", "3"));

      expect(nodes.map(n => n.id)).toEqual(["1", "2", "3"]);
    });

    test("reuses the same node objects across page turns", () => {
      const first = pool.resolve(createFavorites("1", "2", "3"));
      const second = pool.resolve(createFavorites("4", "5", "6"));

      expect(second.map(n => n.serial)).toEqual(first.map(n => n.serial));
      expect(second.map(n => n.id)).toEqual(["4", "5", "6"]);
    });

    test("creates no more nodes than the largest page seen", () => {
      pool.resolve(createFavorites("1", "2", "3", "4", "5"));
      pool.resolve(createFavorites("6", "7"));

      expect(created).toHaveLength(5);
    });

    test("grows the pool when a later page is larger", () => {
      pool.resolve(createFavorites("1", "2"));
      const bigger = pool.resolve(createFavorites("3", "4", "5", "6"));

      expect(created).toHaveLength(4);
      expect(bigger.map(n => n.id)).toEqual(["3", "4", "5", "6"]);
    });

    test("blanks images of nodes dropped from the active set when a page shrinks", () => {
      pool.resolve(createFavorites("1", "2", "3", "4"));
      pool.resolve(createFavorites("5", "6"));

      expect(created.map(n => n.blanked)).toEqual([false, false, true, true]);
    });

    test("does not blank nodes that remain active", () => {
      pool.resolve(createFavorites("1", "2", "3"));
      pool.resolve(createFavorites("4", "5", "6"));

      expect(created.every(n => !n.blanked)).toBe(true);
    });
  });

  describe("resolveAppended", () => {
    test("returns only the appended nodes without disturbing existing ones", () => {
      const initial = pool.resolve(createFavorites("1", "2"));
      const appended = pool.resolveAppended(createFavorites("3", "4"));

      expect(appended.map(n => n.id)).toEqual(["3", "4"]);
      expect(initial.map(n => n.id)).toEqual(["1", "2"]);
      expect(appended.map(n => n.serial)).toEqual([2, 3]);
    });

    test("keeps appended nodes addressable by setFavorited", () => {
      pool.resolve(createFavorites("1", "2"));
      const [appended] = pool.resolveAppended(createFavorites("9"));

      pool.setFavorited("9", true);

      expect(appended.favorited).toBe(true);
    });
  });

  describe("setFavorited", () => {
    test("marks a visible node as favorited", () => {
      const [node] = pool.resolve(createFavorites("1"));

      pool.setFavorited("1", true);

      expect(node.favorited).toBe(true);
    });

    test("does nothing for an id not on the current page", () => {
      const nodes = pool.resolve(createFavorites("1", "2"));

      pool.setFavorited("999", true);

      expect(nodes.every(n => !n.favorited)).toBe(true);
    });

    test("remembers favorited state and reapplies it when the id is rebound", () => {
      pool.resolve(createFavorites("1", "2"));
      pool.setFavorited("1", true);
      pool.resolve(createFavorites("3", "4"));
      const rebound = pool.resolve(createFavorites("1", "2"));

      expect(rebound[0].favorited).toBe(true);
    });

    test("does not leak favorited state onto a recycled node bound to a different id", () => {
      pool.resolve(createFavorites("1", "2"));
      pool.setFavorited("1", true);
      const next = pool.resolve(createFavorites("3", "4"));

      expect(next.every(n => !n.favorited)).toBe(true);
    });

    test("clears remembered favorited state when toggled off", () => {
      pool.resolve(createFavorites("1"));
      pool.setFavorited("1", true);
      pool.setFavorited("1", false);
      const rebound = pool.resolve(createFavorites("2"));

      pool.resolve(createFavorites("1"));

      expect(rebound[0].favorited).toBe(false);
    });

    test("does not address a stale node from a previous page after resolve reassigns ids", () => {
      const [slotZero] = pool.resolve(createFavorites("1"));

      pool.resolve(createFavorites("2"));
      pool.setFavorited("1", true);

      expect(slotZero.id).toBe("2");
      expect(slotZero.favorited).toBe(false);
    });
  });

  describe("reclaim", () => {
    test("drops retained nodes beyond the cap, forcing re-creation on grow-back", () => {
      const capped = new FavoritesThumbPool(ops, 3, false);

      capped.resolve(createFavorites("1", "2", "3", "4", "5", "6"));
      expect(created).toHaveLength(6);

      capped.resolve(createFavorites("7", "8"));
      capped.resolve(createFavorites("a", "b", "c", "d", "e", "f"));

      expect(created).toHaveLength(9);
    });

    test("retains at least the cap so a grow-back within it reuses nodes", () => {
      const capped = new FavoritesThumbPool(ops, 4, false);
      const first = capped.resolve(createFavorites("1", "2", "3", "4"));

      capped.resolve(createFavorites("5"));
      const grown = capped.resolve(createFavorites("6", "7", "8", "9"));

      expect(grown.map(n => n.serial)).toEqual(first.map(n => n.serial));
      expect(created).toHaveLength(4);
    });

    test("never drops nodes that are still active even when active exceeds the cap", () => {
      const capped = new FavoritesThumbPool(ops, 2, false);
      const active = capped.resolve(createFavorites("1", "2", "3", "4", "5"));

      expect(active.map(n => n.id)).toEqual(["1", "2", "3", "4", "5"]);
      expect(created).toHaveLength(5);
    });

    test("blanks the surviving reserve while dropping the rest", () => {
      const capped = new FavoritesThumbPool(ops, 3, false);

      capped.resolve(createFavorites("1", "2", "3", "4", "5"));
      capped.resolve(createFavorites("6"));

      expect(created[0].blanked).toBe(false);
      expect(created[1].blanked).toBe(true);
      expect(created[2].blanked).toBe(true);
    });
  });

  describe("defaultFavorited", () => {
    test("binds every node as favorited when the default is on", () => {
      const owned = new FavoritesThumbPool(ops, LARGE_RETAINED, true);
      const nodes = owned.resolve(createFavorites("1", "2", "3"));

      expect(nodes.every(n => n.favorited)).toBe(true);
    });

    test("an override switches a single node off against an on default", () => {
      const owned = new FavoritesThumbPool(ops, LARGE_RETAINED, true);
      const [first, second] = owned.resolve(createFavorites("1", "2"));

      owned.setFavorited("1", false);

      expect(first.favorited).toBe(false);
      expect(second.favorited).toBe(true);
    });

    test("an off override persists when the id is rebound", () => {
      const owned = new FavoritesThumbPool(ops, LARGE_RETAINED, true);

      owned.resolve(createFavorites("1", "2"));
      owned.setFavorited("1", false);
      owned.resolve(createFavorites("3", "4"));
      const rebound = owned.resolve(createFavorites("1", "2"));

      expect(rebound[0].favorited).toBe(false);
      expect(rebound[1].favorited).toBe(true);
    });
  });
});

function createFavorites(...ids: string[]): Favorite[] {
  return ids.map(id => ({ id }) as Favorite);
}
