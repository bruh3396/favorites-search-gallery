import { LightboxCommandTargets, createLightboxCommandHandlers } from "@/core/features/lightbox2/command_handlers";
import { describe, expect, test, vi } from "vitest";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createPost } from "@/testing/post";

const POST = createPost();

function setup(): {
  targets: LightboxCommandTargets<Post>;
  currentItem: Signal<Post | undefined>;
  isZoomed: Signal<boolean>;
} {
  const currentItem = new Signal<Post | undefined>(POST);
  const isZoomed = new Signal(false);
  const targets = {
    navigation: { currentItem, goToNext: vi.fn(() => Promise.resolve()), goToPrevious: vi.fn(() => Promise.resolve()) },
    stage: { togglePause: vi.fn(), toggleMute: vi.fn() },
    fullscreen: { toggle: vi.fn() },
    zoom: { isZoomed, toggle: vi.fn(), zoomOut: vi.fn() },
    autoplay: { toggle: vi.fn() },
    closer: { close: vi.fn() },
    actions: { download: vi.fn(), openPostPage: vi.fn(), openOriginal: vi.fn() }
  };
  return { targets, currentItem, isZoomed };
}

describe("createLightboxCommandHandlers", () => {
  test("zooms out on dismiss when zoomed", () => {
    const { targets, isZoomed } = setup();

    isZoomed.value = true;
    createLightboxCommandHandlers(targets).dismiss();
    expect(targets.zoom.zoomOut).toHaveBeenCalledOnce();
    expect(targets.closer.close).not.toHaveBeenCalled();
  });

  test("closes on dismiss when not zoomed", () => {
    const { targets } = setup();

    createLightboxCommandHandlers(targets).dismiss();
    expect(targets.closer.close).toHaveBeenCalledOnce();
    expect(targets.zoom.zoomOut).not.toHaveBeenCalled();
  });

  test("passes the current item to item actions", () => {
    const { targets } = setup();
    const handlers = createLightboxCommandHandlers(targets);

    handlers.download();
    handlers.openPostPage();
    handlers.openOriginal();
    expect(targets.actions.download).toHaveBeenCalledWith(POST);
    expect(targets.actions.openPostPage).toHaveBeenCalledWith(POST);
    expect(targets.actions.openOriginal).toHaveBeenCalledWith(POST);
  });

  test("skips item actions when no item is current", () => {
    const { targets, currentItem } = setup();
    const handlers = createLightboxCommandHandlers(targets);

    currentItem.value = undefined;
    handlers.download();
    handlers.openPostPage();
    handlers.openOriginal();
    expect(targets.actions.download).not.toHaveBeenCalled();
    expect(targets.actions.openPostPage).not.toHaveBeenCalled();
    expect(targets.actions.openOriginal).not.toHaveBeenCalled();
  });

  test("reads the current item when the action runs", () => {
    const { targets, currentItem } = setup();
    const handlers = createLightboxCommandHandlers(targets);
    const later = createPost({ id: "later" });

    currentItem.value = later;
    handlers.download();
    expect(targets.actions.download).toHaveBeenCalledWith(later);
  });

  test("logs a failed navigation instead of throwing", async() => {
    const { targets } = setup();
    const error = new Error("offline");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const goToNext = vi.fn(() => Promise.reject(error));

    createLightboxCommandHandlers({ ...targets, navigation: { ...targets.navigation, goToNext } }).showNext();
    await Promise.resolve();
    expect(log).toHaveBeenCalledWith(error);
    log.mockRestore();
  });
});
