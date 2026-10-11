import { MockInstance, describe, expect, onTestFinished, test, vi } from "vitest";
import { LightboxRendererClass } from "@/core/ui/lightbox/stage/renderer";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { VideoElementPool } from "@/core/ui/lightbox/stage/video/element_pool";
import { VideoRenderer } from "@/core/ui/lightbox/stage/video/renderer";
import { render } from "@/core/ui/h/h";

const PRELOAD_SETTLE_DELAY = 75;
const FIRST: MediaItem = { id: "1", media: { kind: "video", locator: "videos/1.mp4" } };
const SECOND: MediaItem = { id: "2", media: { kind: "video", locator: "videos/2.mp4" } };
const THIRD: MediaItem = { id: "3", media: { kind: "video", locator: "videos/3.mp4" } };

interface Setup {
  renderer: VideoRenderer;
  scheduler: MemoryScheduler;
  update: MockInstance<VideoElementPool["update"]>;
  dispose: MockInstance<VideoElementPool["dispose"]>;
}

function setup(): Setup {
  const update = vi.spyOn(VideoElementPool.prototype, "update").mockImplementation(() => undefined);
  const dispose = vi.spyOn(VideoElementPool.prototype, "dispose").mockImplementation(() => undefined);
  const scheduler = new MemoryScheduler();
  const resolveOriginalUrl = (): Promise<string> => Promise.resolve("https://original/video.mp4");
  const { result: renderer } = render(document, () => new VideoRenderer({ resolveOriginalUrl, scheduler }));

  onTestFinished(() => {
    vi.restoreAllMocks();
  });
  return { renderer, scheduler, update, dispose };
}

describe("VideoRenderer", () => {
  test("starts hidden with its pooled videos in the stage root", () => {
    const { renderer } = setup();

    expect(renderer.root.className).toBe(LightboxRendererClass.root);
    expect(renderer.root.hidden).toBe(true);
    expect(renderer.root.querySelectorAll("video")).toHaveLength(5);
  });

  test("shows the current item without its neighbors until they settle", () => {
    const { renderer, scheduler, update } = setup();

    renderer.show(FIRST);
    renderer.setNeighbors([SECOND]);
    expect(renderer.root.hidden).toBe(false);
    expect(update).toHaveBeenLastCalledWith(FIRST, []);

    scheduler.advance(PRELOAD_SETTLE_DELAY);
    expect(update).toHaveBeenLastCalledWith(FIRST, [SECOND]);
  });

  test("keeps only the settled neighbors that are still neighbors", () => {
    const { renderer, scheduler, update } = setup();

    renderer.show(FIRST);
    renderer.setNeighbors([SECOND, THIRD]);
    scheduler.advance(PRELOAD_SETTLE_DELAY);
    renderer.setNeighbors([THIRD]);

    expect(update).toHaveBeenLastCalledWith(FIRST, [THIRD]);
  });

  test("hides once cleared", () => {
    const { renderer, update } = setup();

    renderer.show(FIRST);
    renderer.clear();

    expect(renderer.root.hidden).toBe(true);
    expect(update).toHaveBeenLastCalledWith(undefined, []);
  });

  test("disposes its pool, hides, and drops a pending preload when disposed", () => {
    const { renderer, scheduler, update, dispose } = setup();

    renderer.show(FIRST);
    renderer.setNeighbors([SECOND]);
    renderer.dispose();
    const updates = update.mock.calls.length;

    scheduler.advance(PRELOAD_SETTLE_DELAY);

    expect(dispose).toHaveBeenCalledOnce();
    expect(renderer.root.hidden).toBe(true);
    expect(update).toHaveBeenCalledTimes(updates);
  });
});
