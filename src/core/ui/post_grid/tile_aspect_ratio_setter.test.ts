import { describe, expect, test } from "vitest";
import { setTileAspectRatio } from "@/core/ui/post_grid/tile_aspect_ratio_setter";

function readAspectRatio(root: HTMLElement): string {
  return root.style.getPropertyValue("--fsg-Tile-aspect-ratio");
}

describe("setTileAspectRatio", () => {
  test("shapes the tile from a size", () => {
    const root = document.createElement("div");

    setTileAspectRatio(root, { width: 300, height: 200 });
    expect(readAspectRatio(root)).toBe("300 / 200");
  });

  test("ignores a size without area", () => {
    const root = document.createElement("div");

    setTileAspectRatio(root, { width: 0, height: 200 });
    expect(readAspectRatio(root)).toBe("");
  });

  test("keeps the first shape", () => {
    const root = document.createElement("div");

    setTileAspectRatio(root, { width: 300, height: 200 });
    setTileAspectRatio(root, { width: 100, height: 100 });
    expect(readAspectRatio(root)).toBe("300 / 200");
  });
});
