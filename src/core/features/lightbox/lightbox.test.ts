import { DEFAULT_LIGHTBOX_CONFIGURATION, LightboxService, createLightboxService } from "@/core/features/lightbox/lightbox";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { LightboxButtonClass } from "@/core/features/lightbox/ui/controls/button/button";
import { MediaItem } from "@/core/domain/post/post";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { MemoryFileSaver } from "@/adapters/memory/ports/file_saver/file_saver";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/navigator";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import { MemoryViewport } from "@/adapters/memory/ports/viewport/viewport";
import { flushMicrotasks } from "@/testing/async";
import { render } from "@/core/ui/h/h";

const ITEMS: readonly MediaItem[] = ["1", "2", "3"].map(id => ({ id, media: { kind: "image", locator: `images/${id}` } }));

interface Setup {
  lightbox: LightboxService<MediaItem>;
  scheduler: MemoryScheduler;
  viewport: MemoryViewport;
}

function setup(): Setup {
  const scheduler = new MemoryScheduler();
  const viewport = new MemoryViewport();
  const lightbox = createLightboxService<MediaItem>(DEFAULT_LIGHTBOX_CONFIGURATION, {
    remoteMedia: new MemoryRemoteMedia(),
    remotePages: new MemoryRemotePages(),
    navigator: new MemoryNavigator(),
    fileSaver: new MemoryFileSaver(),
    viewport,
    scheduler,
    sizeObserver: new MemorySizeObserver()
  });
  return { lightbox, scheduler, viewport };
}

function sequence(): MediaSequence<MediaItem> {
  const step = (item: MediaItem, offset: number): Promise<MediaItem | undefined> => Promise.resolve(ITEMS[ITEMS.indexOf(item) + offset]);
  return {
    getNext: item => step(item, 1),
    getPrevious: item => step(item, -1),
    positionOf: item => ({ index: ITEMS.indexOf(item), total: ITEMS.length })
  };
}

function pressArrowRight(): void {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
}

function mountScreen(lightbox: LightboxService<MediaItem>): HTMLDialogElement {
  const { result, dispose } = render(document, () => lightbox.createScreen({ locateItem: () => undefined }));

  document.body.append(result);
  onTestFinished(() => {
    dispose();
    result.remove();
  });
  return result as HTMLDialogElement;
}

describe("createLightboxService", () => {
  test("locks the page's scroll while open", () => {
    const { lightbox, viewport } = setup();

    lightbox.open(ITEMS[0], sequence());
    const lockedWhileOpen = viewport.scrollLocked;

    lightbox.close();
    expect([lockedWhileOpen, viewport.scrollLocked]).toEqual([true, false]);
  });

  test("reports the shown item as settled once navigation pauses", async() => {
    const { lightbox, scheduler } = setup();
    const settled: MediaItem[] = [];

    mountScreen(lightbox);
    lightbox.settled.on(item => settled.push(item));
    lightbox.open(ITEMS[0], sequence());
    scheduler.advance(74);
    pressArrowRight();
    await flushMicrotasks();
    scheduler.advance(74);
    expect(settled).toEqual([]);
    scheduler.advance(1);
    expect(settled).toEqual([ITEMS[1]]);
  });

  test("steps to the next item when autoplay's interval passes", async() => {
    const { lightbox, scheduler } = setup();
    const dialog = mountScreen(lightbox);

    lightbox.open(ITEMS[0], sequence());
    dialog.querySelector<HTMLElement>(`.${LightboxButtonClass.root}[data-icon="play"]`)!.click();
    scheduler.advance(DEFAULT_LIGHTBOX_CONFIGURATION.autoplay.interval);
    await flushMicrotasks();
    expect(lightbox.current.value).toBe(ITEMS[1]);
  });

  test("preloads a warmed item's original while closed", async() => {
    const remoteMedia = new MemoryRemoteMedia();
    const decodeOriginal = vi.spyOn(remoteMedia, "decodeOriginal");
    const scheduler = new MemoryScheduler();
    const lightbox = createLightboxService<MediaItem>(DEFAULT_LIGHTBOX_CONFIGURATION, {
      remoteMedia, remotePages: new MemoryRemotePages(), navigator: new MemoryNavigator(),
      fileSaver: new MemoryFileSaver(), viewport: new MemoryViewport(), scheduler, sizeObserver: new MemorySizeObserver()
    });

    mountScreen(lightbox);
    lightbox.warm(ITEMS[0]);
    scheduler.advance(200);
    await vi.waitFor(() => expect(decodeOriginal).toHaveBeenCalledOnce());
  });

  test("stops autoplay when it closes", () => {
    const { lightbox } = setup();
    const dialog = mountScreen(lightbox);
    const findButton = (icon: string): Element | null => dialog.querySelector(`.${LightboxButtonClass.root}[data-icon="${icon}"]`);

    lightbox.open(ITEMS[0], sequence());
    (findButton("play") as HTMLElement).click();
    lightbox.close();
    lightbox.open(ITEMS[0], sequence());
    expect(findButton("play")).not.toBeNull();
  });
});
