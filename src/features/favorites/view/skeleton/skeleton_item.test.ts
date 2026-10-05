import { describe, expect, test } from "vitest";
import { FavoritesSkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";

describe("FavoritesSkeletonItem", () => {
  test("is a tile for its layout", () => {
    const { element } = new FavoritesSkeletonItem({ layout: "grid", size: { width: 3, height: 4 } });

    expect(element.dataset.layout).toBe("grid");
  });

  test("hands its size to the stylesheet", () => {
    const { element } = new FavoritesSkeletonItem({ layout: "native", size: { width: 120, height: 240 } });

    expect(element.style.getPropertyValue("--thumb-width")).toBe("120");
    expect(element.style.getPropertyValue("--thumb-height")).toBe("240");
  });
});
