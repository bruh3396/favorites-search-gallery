import { LightboxCommands, createLightboxCommands } from "@/core/features/lightbox/commands/commands";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryMorpher } from "@/adapters/memory/ports/morpher/morpher";
import { Signal } from "@/core/utils/reactive/signal";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };

interface Setup {
  commands: LightboxCommands;
  current: Signal<MediaItem | undefined>;
  showNext: Mock<() => Promise<void>>;
  showPrevious: Mock<() => Promise<void>>;
  close: Mock<() => void>;
  toggleAutoplay: Mock<() => void>;
  toggleZoom: Mock<(point?: { x: number; y: number }) => void>;
  zoomBy: Mock<(factor: number, point?: { x: number; y: number }) => void>;
  zoomOut: Mock<() => void>;
  panBy: Mock<(deltaX: number, deltaY: number) => void>;
  toggleFullscreen: Mock<() => void>;
  download: Mock<(item: MediaItem) => void>;
  openOriginal: Mock<(item: MediaItem) => void>;
  openPostPage: Mock<(item: MediaItem) => void>;
  morpher: MemoryMorpher;
  shownMedia: HTMLCanvasElement;
  place: HTMLElement;
}

function setup(): Setup {
  const current = new Signal<MediaItem | undefined>(POST);
  const showNext = vi.fn<() => Promise<void>>(() => Promise.resolve());
  const showPrevious = vi.fn<() => Promise<void>>(() => Promise.resolve());
  const close = vi.fn<() => void>(() => {
    current.value = undefined;
  });
  const toggleAutoplay = vi.fn<() => void>();
  const toggleZoom = vi.fn<(point?: { x: number; y: number }) => void>();
  const zoomBy = vi.fn<(factor: number, point?: { x: number; y: number }) => void>();
  const zoomOut = vi.fn<() => void>();
  const panBy = vi.fn<(deltaX: number, deltaY: number) => void>();
  const toggleFullscreen = vi.fn<() => void>();
  const download = vi.fn<(item: MediaItem) => void>();
  const openOriginal = vi.fn<(item: MediaItem) => void>();
  const openPostPage = vi.fn<(item: MediaItem) => void>();
  const morpher = new MemoryMorpher();
  const shownMedia = document.createElement("canvas");
  const place = document.createElement("div");
  const commands = createLightboxCommands<MediaItem>({
    navigation: { current, showNext, showPrevious, close },
    autoplay: { toggle: toggleAutoplay },
    zoom: { toggle: toggleZoom, zoomBy, zoomOut, panBy },
    actions: { download, openOriginal, openPostPage },
    fullscreen: { toggle: toggleFullscreen },
    stage: { shownMedia },
    morpher,
    locateItem: () => place
  });
  return {
    commands, current, showNext, showPrevious, close, toggleAutoplay, toggleZoom, zoomBy, zoomOut, panBy, toggleFullscreen,
    download, openOriginal, openPostPage, morpher, shownMedia, place
  };
}

function silenceConsoleError(): Mock<(...data: unknown[]) => void> {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  onTestFinished(() => consoleError.mockRestore());
  return consoleError;
}

describe("createLightboxCommands", () => {
  test("steps to the next and previous items", () => {
    const { commands, showNext, showPrevious } = setup();

    commands.showNext();
    commands.showPrevious();
    expect([showNext.mock.calls.length, showPrevious.mock.calls.length]).toEqual([1, 1]);
  });

  test("logs a step that fails instead of rejecting", async() => {
    const { commands, showNext, showPrevious } = setup();
    const consoleError = silenceConsoleError();
    const failure = new Error("unreachable");

    showNext.mockRejectedValue(failure);
    showPrevious.mockRejectedValue(failure);
    commands.showNext();
    commands.showPrevious();
    await vi.waitFor(() => expect(consoleError.mock.calls).toEqual([[failure], [failure]]));
  });

  test("closes by morphing the shown media into the item's place", () => {
    const { commands, close, morpher, shownMedia, place } = setup();

    commands.close();
    expect([morpher.morphs, close.mock.calls.length]).toEqual([[{ source: shownMedia, target: place }], 1]);
  });

  test("passes zoom, autoplay, and fullscreen commands to their units", () => {
    const { commands, toggleAutoplay, toggleZoom, zoomBy, zoomOut, panBy, toggleFullscreen } = setup();
    const point = { x: 10, y: 20 };

    commands.toggleAutoplay();
    commands.toggleZoom(point);
    commands.toggleZoom();
    commands.zoomBy(2, point);
    commands.zoomOut();
    commands.panBy(5, -5);
    commands.toggleFullscreen();
    expect([toggleAutoplay.mock.calls, toggleZoom.mock.calls, zoomBy.mock.calls, zoomOut.mock.calls, panBy.mock.calls, toggleFullscreen.mock.calls])
      .toEqual([[[]], [[point], [undefined]], [[2, point]], [[]], [[5, -5]], [[]]]);
  });

  test("downloads and opens the current item", () => {
    const { commands, download, openOriginal, openPostPage } = setup();

    commands.download();
    commands.openOriginal();
    commands.openPostPage();
    expect([download.mock.calls, openOriginal.mock.calls, openPostPage.mock.calls]).toEqual([[[POST]], [[POST]], [[POST]]]);
  });

  test("ignores item commands while no item is shown", () => {
    const { commands, current, download, openOriginal, openPostPage } = setup();

    current.value = undefined;
    commands.download();
    commands.openOriginal();
    commands.openPostPage();
    expect([download, openOriginal, openPostPage].map(action => action.mock.calls.length)).toEqual([0, 0, 0]);
  });
});
