import { describe, expect, test } from "vitest";
import { highlightTile } from "@/core/ui/post_grid/tile_highlighter";

describe("highlightTile", () => {
  test("marks the tile with the highlight until its animation ends", () => {
    const tile = document.createElement("div");

    highlightTile(tile, "sheen");
    expect(tile.dataset.highlight).toBe("sheen");
    tile.dispatchEvent(new Event("animationend"));
    expect(tile.dataset.highlight).toBeUndefined();
  });

  test("does nothing when there is no tile", () => {
    expect(() => highlightTile(undefined, "glow")).not.toThrow();
  });
});
