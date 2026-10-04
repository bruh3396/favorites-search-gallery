import { describe, expect, test, vi } from "vitest";
import { GALLERY_BUDGETS } from "@/features/gallery/view/budget";
import { PostMedia } from "@/core/domain/post/post";

const ITEMS = [{ id: "1" }] as PostMedia[];

interface Targets {
  canvas: { clear: () => void };
  warm: { cacheImages: () => Promise<void>; upscale: () => Promise<void> };
  follow: { scrollToThumb: () => void };
}

function createTargets(): Targets {
  return {
    canvas: { clear: vi.fn() },
    warm: { cacheImages: vi.fn(() => Promise.resolve()), upscale: vi.fn(() => Promise.resolve()) },
    follow: { scrollToThumb: vi.fn() }
  };
}

describe("GALLERY_BUDGETS", () => {
  test("keeps the canvas, preloads full images, and follows in content on a full budget", async() => {
    const targets = createTargets();
    const budget = GALLERY_BUDGETS.full;

    budget.releaseCanvas(targets.canvas);
    await budget.warm(targets.warm, ITEMS);
    budget.follow(targets.follow, "1");

    expect(targets.canvas.clear).not.toHaveBeenCalled();
    expect(targets.warm.cacheImages).toHaveBeenCalledWith(ITEMS);
    expect(targets.warm.upscale).not.toHaveBeenCalled();
    expect(targets.follow.scrollToThumb).toHaveBeenCalledWith("1");
  });

  test("clears the canvas, only upscales thumbs, and stays put on a reduced budget", async() => {
    const targets = createTargets();
    const budget = GALLERY_BUDGETS.reduced;

    budget.releaseCanvas(targets.canvas);
    await budget.warm(targets.warm, ITEMS);
    budget.follow(targets.follow, "1");

    expect(targets.canvas.clear).toHaveBeenCalled();
    expect(targets.warm.upscale).toHaveBeenCalledWith(ITEMS);
    expect(targets.warm.cacheImages).not.toHaveBeenCalled();
    expect(targets.follow.scrollToThumb).not.toHaveBeenCalled();
  });

  test("paints upscaled thumbs smaller and slower on a reduced budget", () => {
    const { full, reduced } = GALLERY_BUDGETS;

    expect(reduced.upscale.canvasWidth).toBeLessThan(full.upscale.canvasWidth);
    expect(reduced.upscale.paintDelay).toBeGreaterThan(full.upscale.paintDelay);
  });
});
