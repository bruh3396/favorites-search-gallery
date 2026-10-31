import { describe, expect, test } from "vitest";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";

describe("TileLocator", () => {
  test("finds nothing before a grid attaches", () => {
    expect(new TileLocator<string>().locate("1")).toBeUndefined();
  });

  test("finds tiles through the attached grid", () => {
    const tileLocator = new TileLocator<string>();
    const tile = document.createElement("div");

    tileLocator.attach(post => (post === "1" ? tile : undefined));
    expect([tileLocator.locate("1"), tileLocator.locate("2")]).toEqual([tile, undefined]);
  });

  test("finds nothing once the grid detaches", () => {
    const tileLocator = new TileLocator<string>();
    const detach = tileLocator.attach(() => document.createElement("div"));

    detach();
    expect(tileLocator.locate("1")).toBeUndefined();
  });

  test("keeps a later grid attached when an earlier one detaches", () => {
    const tileLocator = new TileLocator<string>();
    const tile = document.createElement("div");
    const detachEarlier = tileLocator.attach(() => undefined);

    tileLocator.attach(() => tile);
    detachEarlier();
    expect(tileLocator.locate("1")).toBe(tile);
  });
});
