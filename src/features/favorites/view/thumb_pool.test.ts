import { describe, expect, test } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesThumbPool } from "@/features/favorites/view/thumb_pool";
import { ThumbOperations } from "@/features/favorites/types/types";

interface FakeNode {
  serial: number;
  id: string;
  favorited: boolean;
  blanked: boolean;
}

interface PoolConfiguration {
  maxRetained: number;
  defaultFavorited: boolean;
}

interface Setup {
  pool: FavoritesThumbPool<FakeNode>;
  created: FakeNode[];
  ops: ThumbOperations<FakeNode>;
}

const LARGE_RETAINED = 10_000;

// A pool over fake nodes; `created` records every node the pool asked for, in creation order.
function setup(configuration: Partial<PoolConfiguration> = {}): Setup {
  const created: FakeNode[] = [];
  const ops: ThumbOperations<FakeNode> = {
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
  const pool = new FavoritesThumbPool({ maxRetained: LARGE_RETAINED, defaultFavorited: false, ...configuration }, ops);
  return { pool, created, ops };
}

function createFavorites(...ids: string[]): Favorite[] {
  return ids.map(id => ({ id }) as Favorite);
}

describe("FavoritesThumbPool", () => {
  describe("resolve", () => {
    test("binds a page and returns exactly that many nodes", () => {
      const nodes = setup().pool.resolve(createFavorites("1", "2", "3"));

      expect(nodes.map(n => n.id)).toEqual(["1", "2", "3"]);
    });

    test("reuses the same node objects across page turns", () => {
      const { pool } = setup();
      const first = pool.resolve(createFavorites("1", "2", "3"));
      const second = pool.resolve(createFavorites("4", "5", "6"));

      expect(second.map(n => n.serial)).toEqual(first.map(n => n.serial));
      expect(second.map(n => n.id)).toEqual(["4", "5", "6"]);
    });

    test("creates no more nodes than the largest page seen", () => {
      const { pool, created } = setup();

      pool.resolve(createFavorites("1", "2", "3", "4", "5"));
      pool.resolve(createFavorites("6", "7"));
      expect(created).toHaveLength(5);
    });

    test("grows the pool when a later page is larger", () => {
      const { pool, created } = setup();

      pool.resolve(createFavorites("1", "2"));
      const bigger = pool.resolve(createFavorites("3", "4", "5", "6"));

      expect(created).toHaveLength(4);
      expect(bigger.map(n => n.id)).toEqual(["3", "4", "5", "6"]);
    });

    test("blanks images of nodes dropped from the active set when a page shrinks", () => {
      const { pool, created } = setup();

      pool.resolve(createFavorites("1", "2", "3", "4"));
      pool.resolve(createFavorites("5", "6"));
      expect(created.map(n => n.blanked)).toEqual([false, false, true, true]);
    });

    test("does not blank nodes that remain active", () => {
      const { pool, created } = setup();

      pool.resolve(createFavorites("1", "2", "3"));
      pool.resolve(createFavorites("4", "5", "6"));
      expect(created.every(n => !n.blanked)).toBe(true);
    });

    test("binds every node as favorited when the default is on", () => {
      const nodes = setup({ defaultFavorited: true }).pool.resolve(createFavorites("1", "2", "3"));

      expect(nodes.every(n => n.favorited)).toBe(true);
    });

    test("drops retained nodes beyond maxRetained, forcing re-creation on grow-back", () => {
      const { pool, created } = setup({ maxRetained: 3 });

      pool.resolve(createFavorites("1", "2", "3", "4", "5", "6"));
      expect(created).toHaveLength(6);
      pool.resolve(createFavorites("7", "8"));
      pool.resolve(createFavorites("a", "b", "c", "d", "e", "f"));
      expect(created).toHaveLength(9);
    });

    test("retains at least maxRetained nodes so a grow-back within it reuses them", () => {
      const { pool, created } = setup({ maxRetained: 4 });
      const first = pool.resolve(createFavorites("1", "2", "3", "4"));

      pool.resolve(createFavorites("5"));
      const grown = pool.resolve(createFavorites("6", "7", "8", "9"));

      expect(grown.map(n => n.serial)).toEqual(first.map(n => n.serial));
      expect(created).toHaveLength(4);
    });

    test("never drops active nodes, even beyond maxRetained", () => {
      const { pool, created } = setup({ maxRetained: 2 });
      const active = pool.resolve(createFavorites("1", "2", "3", "4", "5"));

      expect(active.map(n => n.id)).toEqual(["1", "2", "3", "4", "5"]);
      expect(created).toHaveLength(5);
    });

    test("blanks the surviving reserve while dropping the rest", () => {
      const { pool, created } = setup({ maxRetained: 3 });

      pool.resolve(createFavorites("1", "2", "3", "4", "5"));
      pool.resolve(createFavorites("6"));
      expect(created[0].blanked).toBe(false);
      expect(created[1].blanked).toBe(true);
      expect(created[2].blanked).toBe(true);
    });
  });

  describe("resolveAppended", () => {
    test("returns only the appended nodes without disturbing existing ones", () => {
      const { pool } = setup();
      const initial = pool.resolve(createFavorites("1", "2"));
      const appended = pool.resolveAppended(createFavorites("3", "4"));

      expect(appended.map(n => n.id)).toEqual(["3", "4"]);
      expect(initial.map(n => n.id)).toEqual(["1", "2"]);
      expect(appended.map(n => n.serial)).toEqual([2, 3]);
    });

    test("keeps appended nodes addressable by setFavorited", () => {
      const { pool } = setup();

      pool.resolve(createFavorites("1", "2"));
      const [appended] = pool.resolveAppended(createFavorites("9"));

      pool.setFavorited("9", true);
      expect(appended.favorited).toBe(true);
    });
  });

  describe("setFavorited", () => {
    test("marks a visible node as favorited", () => {
      const { pool } = setup();
      const [node] = pool.resolve(createFavorites("1"));

      pool.setFavorited("1", true);
      expect(node.favorited).toBe(true);
    });

    test("does nothing for an id not on the current page", () => {
      const { pool } = setup();
      const nodes = pool.resolve(createFavorites("1", "2"));

      pool.setFavorited("999", true);
      expect(nodes.every(n => !n.favorited)).toBe(true);
    });

    test("remembers favorited state and reapplies it when the id is rebound", () => {
      const { pool } = setup();

      pool.resolve(createFavorites("1", "2"));
      pool.setFavorited("1", true);
      pool.resolve(createFavorites("3", "4"));
      const rebound = pool.resolve(createFavorites("1", "2"));

      expect(rebound[0].favorited).toBe(true);
    });

    test("does not leak favorited state onto a recycled node bound to a different id", () => {
      const { pool } = setup();

      pool.resolve(createFavorites("1", "2"));
      pool.setFavorited("1", true);
      const next = pool.resolve(createFavorites("3", "4"));

      expect(next.every(n => !n.favorited)).toBe(true);
    });

    test("clears remembered favorited state when toggled off", () => {
      const { pool } = setup();

      pool.resolve(createFavorites("1"));
      pool.setFavorited("1", true);
      pool.setFavorited("1", false);
      const rebound = pool.resolve(createFavorites("2"));

      pool.resolve(createFavorites("1"));
      expect(rebound[0].favorited).toBe(false);
    });

    test("does not address a stale node from a previous page after resolve reassigns ids", () => {
      const { pool } = setup();
      const [slotZero] = pool.resolve(createFavorites("1"));

      pool.resolve(createFavorites("2"));
      pool.setFavorited("1", true);
      expect(slotZero.id).toBe("2");
      expect(slotZero.favorited).toBe(false);
    });

    test("switches a single node off against an on default", () => {
      const { pool } = setup({ defaultFavorited: true });
      const [first, second] = pool.resolve(createFavorites("1", "2"));

      pool.setFavorited("1", false);
      expect(first.favorited).toBe(false);
      expect(second.favorited).toBe(true);
    });

    test("keeps an off override against an on default when the id is rebound", () => {
      const { pool } = setup({ defaultFavorited: true });

      pool.resolve(createFavorites("1", "2"));
      pool.setFavorited("1", false);
      pool.resolve(createFavorites("3", "4"));
      const rebound = pool.resolve(createFavorites("1", "2"));

      expect(rebound[0].favorited).toBe(false);
      expect(rebound[1].favorited).toBe(true);
    });
  });

  describe("rebind", () => {
    test("redraws the visible node of a favorite, keeping its favorited state", () => {
      const { pool, ops } = setup();
      const [node] = pool.resolve(createFavorites("1"));
      const redrawn = { id: "1" } as Favorite;
      const bound: Favorite[] = [];

      pool.setFavorited("1", true);
      ops.bind = (_node, favorite, favorited): void => {
        bound.push(favorite);
        node.favorited = favorited;
      };
      pool.rebind(redrawn);
      expect(bound).toEqual([redrawn]);
      expect(node.favorited).toBe(true);
    });

    test("does nothing for a favorite not on the current page", () => {
      const { pool, ops } = setup();
      const bound: string[] = [];

      pool.resolve(createFavorites("1"));
      pool.resolve(createFavorites("2"));
      ops.bind = (_node, favorite): void => {
        bound.push(favorite.id);
      };
      pool.rebind({ id: "1" } as Favorite);
      expect(bound).toEqual([]);
    });
  });
});
