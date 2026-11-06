import { LightboxCommandHandlersDependencies, createLightboxCommandHandlers } from "@/core/features/lightbox/commands/lightbox_command_handlers";
import { describe, expect, test, vi } from "vitest";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createPost } from "@/testing/post";

const POST = createPost();

function setup(): {
  lightboxCommandHandlersDependencies: LightboxCommandHandlersDependencies<Post>;
  currentItem: Signal<Post | undefined>;
  isZoomed: Signal<boolean>;
} {
  const currentItem = new Signal<Post | undefined>(POST);
  const isZoomed = new Signal(false);
  const lightboxCommandHandlersDependencies = {
    lightboxNavigation: { currentItem, goToNext: vi.fn(() => Promise.resolve()), goToPrevious: vi.fn(() => Promise.resolve()) },
    lightboxStage: { togglePause: vi.fn(), toggleMute: vi.fn() },
    lightboxFullscreen: { toggle: vi.fn() },
    lightboxZoom: { isZoomed, toggle: vi.fn(), zoomOut: vi.fn() },
    lightboxAutoplay: { toggle: vi.fn() },
    lightboxCloser: { close: vi.fn() },
    lightboxActions: { download: vi.fn(), openPostPage: vi.fn(), openOriginal: vi.fn() }
  };
  return { lightboxCommandHandlersDependencies, currentItem, isZoomed };
}

describe("createLightboxCommandHandlers", () => {
  const commandCases: Array<[LightboxCommand, (lightboxCommandHandlersDependencies: LightboxCommandHandlersDependencies<Post>) => unknown]> = [
    ["showNext", (lightboxCommandHandlersDependencies): unknown => lightboxCommandHandlersDependencies.lightboxNavigation.goToNext],
    ["showPrevious", (lightboxCommandHandlersDependencies): unknown => lightboxCommandHandlersDependencies.lightboxNavigation.goToPrevious],
    ["toggleAutoplay", (lightboxCommandHandlersDependencies): unknown => lightboxCommandHandlersDependencies.lightboxAutoplay.toggle],
    ["togglePause", (lightboxCommandHandlersDependencies): unknown => lightboxCommandHandlersDependencies.lightboxStage.togglePause],
    ["toggleMute", (lightboxCommandHandlersDependencies): unknown => lightboxCommandHandlersDependencies.lightboxStage.toggleMute],
    ["toggleFullscreen", (lightboxCommandHandlersDependencies): unknown => lightboxCommandHandlersDependencies.lightboxFullscreen.toggle],
    ["toggleZoom", (lightboxCommandHandlersDependencies): unknown => lightboxCommandHandlersDependencies.lightboxZoom.toggle],
    ["close", (lightboxCommandHandlersDependencies): unknown => lightboxCommandHandlersDependencies.lightboxCloser.close]
  ];

  test.each(commandCases)("runs %s on its target", (lightboxCommand, selectTarget) => {
    const { lightboxCommandHandlersDependencies } = setup();

    createLightboxCommandHandlers(lightboxCommandHandlersDependencies)[lightboxCommand]();
    expect(selectTarget(lightboxCommandHandlersDependencies)).toHaveBeenCalledOnce();
  });

  test("zooms out on dismiss when zoomed", () => {
    const { lightboxCommandHandlersDependencies, isZoomed } = setup();

    isZoomed.value = true;
    createLightboxCommandHandlers(lightboxCommandHandlersDependencies).dismiss();
    expect(lightboxCommandHandlersDependencies.lightboxZoom.zoomOut).toHaveBeenCalledOnce();
    expect(lightboxCommandHandlersDependencies.lightboxCloser.close).not.toHaveBeenCalled();
  });

  test("closes on dismiss when not zoomed", () => {
    const { lightboxCommandHandlersDependencies } = setup();

    createLightboxCommandHandlers(lightboxCommandHandlersDependencies).dismiss();
    expect(lightboxCommandHandlersDependencies.lightboxCloser.close).toHaveBeenCalledOnce();
    expect(lightboxCommandHandlersDependencies.lightboxZoom.zoomOut).not.toHaveBeenCalled();
  });

  test("passes the current item to item actions", () => {
    const { lightboxCommandHandlersDependencies } = setup();
    const handlers = createLightboxCommandHandlers(lightboxCommandHandlersDependencies);

    handlers.download();
    handlers.openPostPage();
    handlers.openOriginal();
    expect(lightboxCommandHandlersDependencies.lightboxActions.download).toHaveBeenCalledWith(POST);
    expect(lightboxCommandHandlersDependencies.lightboxActions.openPostPage).toHaveBeenCalledWith(POST);
    expect(lightboxCommandHandlersDependencies.lightboxActions.openOriginal).toHaveBeenCalledWith(POST);
  });

  test("skips item actions when no item is current", () => {
    const { lightboxCommandHandlersDependencies, currentItem } = setup();
    const handlers = createLightboxCommandHandlers(lightboxCommandHandlersDependencies);

    currentItem.value = undefined;
    handlers.download();
    handlers.openPostPage();
    handlers.openOriginal();
    expect(lightboxCommandHandlersDependencies.lightboxActions.download).not.toHaveBeenCalled();
    expect(lightboxCommandHandlersDependencies.lightboxActions.openPostPage).not.toHaveBeenCalled();
    expect(lightboxCommandHandlersDependencies.lightboxActions.openOriginal).not.toHaveBeenCalled();
  });

  test("reads the current item when the action runs", () => {
    const { lightboxCommandHandlersDependencies, currentItem } = setup();
    const handlers = createLightboxCommandHandlers(lightboxCommandHandlersDependencies);
    const laterPost = createPost({ id: "later" });

    currentItem.value = laterPost;
    handlers.download();
    expect(lightboxCommandHandlersDependencies.lightboxActions.download).toHaveBeenCalledWith(laterPost);
  });

  test("adds the current item as a favorite", () => {
    const { lightboxCommandHandlersDependencies } = setup();
    const lightboxFavorite = { add: vi.fn() };

    createLightboxCommandHandlers({ ...lightboxCommandHandlersDependencies, lightboxFavorite }).addFavorite();
    expect(lightboxFavorite.add).toHaveBeenCalledWith(POST);
  });

  test("ignores adding a favorite without a favorite action", () => {
    const { lightboxCommandHandlersDependencies } = setup();

    expect(() => createLightboxCommandHandlers(lightboxCommandHandlersDependencies).addFavorite()).not.toThrow();
  });

  test("flips the details panel's open state", () => {
    const { lightboxCommandHandlersDependencies } = setup();
    const isOpen = new KeyedStoredValue({ key: "detailsOpen", defaultValue: false }, { storedValueStorage: new MemoryLocalKeyedValues() });
    const handlers = createLightboxCommandHandlers({ ...lightboxCommandHandlersDependencies, lightboxDetails: { isOpen } });

    handlers.toggleDetails();
    expect(isOpen.value).toBe(true);
    handlers.toggleDetails();
    expect(isOpen.value).toBe(false);
  });

  test("ignores the details toggle without a details panel", () => {
    const { lightboxCommandHandlersDependencies } = setup();

    expect(() => createLightboxCommandHandlers(lightboxCommandHandlersDependencies).toggleDetails()).not.toThrow();
  });

  test("logs a failed navigation instead of throwing", async() => {
    const { lightboxCommandHandlersDependencies } = setup();
    const error = new Error("offline");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const goToNext = vi.fn(() => Promise.reject(error));

    createLightboxCommandHandlers({
      ...lightboxCommandHandlersDependencies,
      lightboxNavigation: { ...lightboxCommandHandlersDependencies.lightboxNavigation, goToNext }
    }).showNext();
    await Promise.resolve();
    expect(log).toHaveBeenCalledWith(error);
    log.mockRestore();
  });
});
