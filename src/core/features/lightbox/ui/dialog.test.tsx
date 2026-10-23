import { LightboxDialog, LightboxDialogClass } from "@/core/features/lightbox/ui/dialog";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import DIALOG_CSS from "@/core/features/lightbox/ui/dialog.css?inline";
import { LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay_visibility";
import { LightboxStage } from "@/core/features/lightbox/stage/stage";
import { LightboxVideoClass } from "@/core/features/lightbox/ui/media/video";
import { LightboxZoom } from "@/core/features/lightbox/zoom/zoom";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { StoredPreference } from "@/core/utils/reactive/preference";
import { expectClassesStyled } from "@/testing/css";

const IDLE_DELAY = 100;
const LEAVE_DELAY = 500;

function setup(): {
  dialog: HTMLDialogElement;
  isOpen: Signal<boolean>;
  scheduler: MemoryScheduler;
  handlers: LightboxCommandHandlers;
  keyListener: (event: KeyboardEvent) => void;
} {
  const isOpen = new Signal(false);
  const scheduler = new MemoryScheduler();
  const currentItem = new Signal<Post | undefined>(undefined);
  const storage = { get: (): undefined => undefined, set: (): void => undefined };
  const handlers = {
    close: vi.fn(),
    togglePause: vi.fn(),
    showNext: vi.fn(),
    showPrevious: vi.fn()
  } as Partial<LightboxCommandHandlers> as LightboxCommandHandlers;
  const keyListener = vi.fn();
  const { result: dialog } = render(document, () => {
    const stage = new LightboxStage<Post>({ gifCapacity: 1, videoCapacity: 1 }, {
      remoteMedia: new MemoryRemoteMedia(),
      currentItem,
      retainedItems: new Signal<readonly Post[]>([]),
      volume: new StoredPreference({ key: "volume", defaultValue: 1 }, { storage }),
      muted: new StoredPreference({ key: "muted", defaultValue: false }, { storage })
    });
    return (
      <LightboxDialog
        isOpen={isOpen}
        position={new Signal(undefined)}
        stage={stage}
        overlayVisibility={new LightboxOverlayVisibility({ idleDelay: IDLE_DELAY, leaveDelay: LEAVE_DELAY }, scheduler)}
        inFullscreen={new Signal(false)}
        zoom={new LightboxZoom({ minimumScale: 2, maximumScale: 8 }, { currentItem, mediaSize: stage.mediaSize })}
        autoplay={{ isPlaying: new Signal(false), countdown: new Signal(undefined) }}
        sizeObserver={new MemorySizeObserver()}
        handlers={handlers}
        keyListener={keyListener}
        mouseListeners={{ onWheel: vi.fn(), onMousedown: vi.fn(), onAuxclick: vi.fn(), onContextmenu: vi.fn() }}
      />
    ) as HTMLDialogElement;
  });

  document.body.append(dialog);
  return { dialog, isOpen, scheduler, handlers, keyListener };
}

function setupOpen(): ReturnType<typeof setup> {
  const result = setup();

  result.isOpen.value = true;
  return result;
}

function findButton(dialog: HTMLElement, label: string): HTMLButtonElement {
  return dialog.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("LightboxDialog", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxDialogClass, DIALOG_CSS);
  });

  test("opens as a focused modal with the lightbox and closes with it", () => {
    const { dialog, isOpen } = setup();

    expect(dialog.open).toBe(false);
    isOpen.value = true;
    expect(dialog.open).toBe(true);
    expect(document.activeElement).toBe(dialog);
    isOpen.value = false;
    expect(dialog.open).toBe(false);
  });

  test("closes the lightbox when the dialog closes itself", () => {
    const { dialog, handlers } = setupOpen();

    dialog.dispatchEvent(new Event("close"));
    expect(handlers.close).toHaveBeenCalledOnce();
  });

  test("passes keys to its key listener", () => {
    const { dialog, keyListener } = setupOpen();
    const event = new KeyboardEvent("keydown", { key: "ArrowRight" });

    dialog.dispatchEvent(event);
    expect(keyListener).toHaveBeenCalledWith(event);
  });

  test("idles the overlay once the pointer rests, and wakes it when the pointer moves", () => {
    const { dialog, scheduler } = setupOpen();

    expect(dialog.hasAttribute("data-idle")).toBe(false);
    scheduler.advance(IDLE_DELAY);
    expect(dialog.hasAttribute("data-idle")).toBe(true);
    dialog.dispatchEvent(new PointerEvent("pointermove"));
    expect(dialog.hasAttribute("data-idle")).toBe(false);
  });

  test("idles the overlay a while after the pointer leaves", () => {
    const { dialog, scheduler } = setupOpen();

    dialog.dispatchEvent(new PointerEvent("pointerleave"));
    scheduler.advance(LEAVE_DELAY - 1);
    expect(dialog.hasAttribute("data-idle")).toBe(false);
    scheduler.advance(1);
    expect(dialog.hasAttribute("data-idle")).toBe(true);
  });

  test("keeps the overlay awake while the pointer is over the chrome", () => {
    const { dialog, scheduler } = setupOpen();
    const slot = findButton(dialog, "Next").parentElement!;

    slot.dispatchEvent(new PointerEvent("pointerenter"));
    scheduler.advance(LEAVE_DELAY);
    expect(dialog.hasAttribute("data-idle")).toBe(false);
    slot.dispatchEvent(new PointerEvent("pointerleave"));
    scheduler.advance(IDLE_DELAY);
    expect(dialog.hasAttribute("data-idle")).toBe(true);
  });

  test.each<[string, keyof LightboxCommandHandlers]>([
    ["Previous", "showPrevious"],
    ["Next", "showNext"]
  ])("runs %s's command from its arrow", (label, command) => {
    const { dialog, handlers } = setupOpen();

    findButton(dialog, label).click();
    expect(handlers[command]).toHaveBeenCalledOnce();
  });

  test("toggles pause on a click on the video", () => {
    const { dialog, handlers } = setupOpen();

    dialog.querySelector<HTMLElement>(`.${LightboxVideoClass.root}`)!.click();
    expect(handlers.togglePause).toHaveBeenCalledOnce();
  });

  test("takes focus back when focus moves into the video", () => {
    const { dialog } = setupOpen();
    const other = document.createElement("button");

    document.body.append(other);
    other.focus();
    dialog.querySelector(`.${LightboxVideoClass.root}`)!.dispatchEvent(new FocusEvent("focusin"));
    expect(document.activeElement).toBe(dialog);
  });
});
