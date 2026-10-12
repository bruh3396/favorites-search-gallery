import { describe, expect, test } from "vitest";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";

describe("TileLocator", () => {
  test("finds nothing before a grid attaches", () => {
    expect(new TileLocator<string>().locate("1")).toBeUndefined();
  });

  test("finds tiles through the attached grid", () => {
    const locator = new TileLocator<string>();
    const tile = document.createElement("div");

    locator.attach(post => (post === "1" ? tile : undefined));
    expect([locator.locate("1"), locator.locate("2")]).toEqual([tile, undefined]);
  });

  test("finds nothing once the grid detaches", () => {
    const locator = new TileLocator<string>();
    const detach = locator.attach(() => document.createElement("div"));

    detach();
    expect(locator.locate("1")).toBeUndefined();
  });

  test("keeps a later grid attached when an earlier one detaches", () => {
    const locator = new TileLocator<string>();
    const tile = document.createElement("div");
    const detachEarlier = locator.attach(() => undefined);

    locator.attach(() => tile);
    detachEarlier();
    expect(locator.locate("1")).toBe(tile);
  });
});
