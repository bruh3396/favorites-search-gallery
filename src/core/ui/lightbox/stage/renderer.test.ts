import { describe, expect, test, vi } from "vitest";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { PreloadingRenderer } from "@/core/ui/lightbox/stage/renderer";

const FIRST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const SECOND: MediaItem = { id: "2", media: { kind: "image", locator: "images/2" } };

class TestPreloadingRenderer extends PreloadingRenderer {
  public readonly preloadNeighbors = vi.fn<(items: readonly MediaItem[]) => void>();

  public get latestNeighbors(): readonly MediaItem[] {
    return this.getNeighbors();
  }

  public dispose(): void {
    this.disposePreloading();
  }
}

function setup(): { renderer: TestPreloadingRenderer; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  return { renderer: new TestPreloadingRenderer(scheduler), scheduler };
}

describe("PreloadingRenderer", () => {
  test("preloads neighbors as one ordered batch after the settling delay", () => {
    const { renderer, scheduler } = setup();

    renderer.setNeighbors([FIRST, SECOND]);
    scheduler.advance(74);
    expect(renderer.preloadNeighbors).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(renderer.preloadNeighbors.mock.calls).toEqual([[[FIRST, SECOND]]]);
  });

  test("replaces pending neighbors with the latest list", () => {
    const { renderer, scheduler } = setup();

    renderer.setNeighbors([FIRST]);
    scheduler.advance(30);
    renderer.setNeighbors([SECOND]);
    scheduler.advance(74);
    expect(renderer.preloadNeighbors).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(renderer.preloadNeighbors.mock.calls).toEqual([[[SECOND]]]);
  });

  test("does not schedule an empty candidate list", () => {
    const { renderer, scheduler } = setup();

    renderer.setNeighbors([]);
    scheduler.advance(75);
    expect(renderer.preloadNeighbors).not.toHaveBeenCalled();
  });

  test("exposes neighbors to subclass retention policies", () => {
    const { renderer } = setup();

    renderer.setNeighbors([FIRST, SECOND]);
    expect(renderer.latestNeighbors).toEqual([FIRST, SECOND]);
  });

  test("cancels pending preloads when disposed", () => {
    const { renderer, scheduler } = setup();

    renderer.setNeighbors([FIRST]);
    renderer.dispose();
    scheduler.advance(75);
    expect(renderer.preloadNeighbors).not.toHaveBeenCalled();
  });

  test("cancels a pending batch when neighbors become empty", () => {
    const { renderer, scheduler } = setup();

    renderer.setNeighbors([FIRST, SECOND]);
    renderer.setNeighbors([]);
    scheduler.advance(75);
    expect(renderer.preloadNeighbors).not.toHaveBeenCalled();
  });
});
