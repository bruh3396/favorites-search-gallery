import { LightboxDialog, LightboxDialogClass } from "@/core/features/lightbox/ui/lightbox_dialog";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import DIALOG_CSS from "@/core/features/lightbox/ui/lightbox_dialog.css?inline";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { LightboxCommand } from "@/core/features/lightbox/input/lightbox_command";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxDetailsPanelClass } from "@/core/features/lightbox/ui/details/lightbox_details_panel";
import { LightboxMediaResolver } from "@/core/features/lightbox/stage/lightbox_media_resolver";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay_visibility/lightbox_overlay_visibility";
import { LightboxStage } from "@/core/features/lightbox/stage/lightbox_stage";
import { LightboxVideoClass } from "@/core/features/lightbox/ui/media/lightbox_video";
import { LightboxViewportClass } from "@/core/features/lightbox/ui/media/lightbox_viewport";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

const IDLE_DELAY = 100;
const LEAVE_DELAY = 500;

function setup(lightboxDetails?: LightboxDetails<Post>): {
  dialog: HTMLDialogElement;
  isOpen: Signal<boolean>;
  simple: Signal<boolean>;
  closesOnPress: Signal<boolean>;
  scheduler: MemoryScheduler;
  handlers: CommandHandlers<LightboxCommand>;
  onKeydown: (event: KeyboardEvent) => void;
} {
  const isOpen = new Signal(false);
  const simple = new Signal(false);
  const closesOnPress = new Signal(false);
  const scheduler = new MemoryScheduler();
  const currentItem = new Signal<Post | undefined>(undefined);
  const storage = { get: (): undefined => undefined, set: (): void => undefined };
  const handlers = {
    close: vi.fn(),
    togglePause: vi.fn(),
    showNext: vi.fn(),
    showPrevious: vi.fn(),
    toggleDetails: vi.fn()
  } as Partial<CommandHandlers<LightboxCommand>> as CommandHandlers<LightboxCommand>;
  const onKeydown = vi.fn();
  const { result: dialog } = render(document, () => {
    const remoteMedia = new MemoryRemoteMedia();
    const lightboxStage = new LightboxStage<Post>({ gifCapacity: 1, videoCapacity: 1 }, {
      remoteMedia,
      lightboxMediaResolver: new LightboxMediaResolver(media => remoteMedia.resolveMedia(media)),
      currentItem,
      retainedItems: new Signal<readonly Post[]>([]),
      volume: new KeyedStoredValue({ key: "volume", defaultValue: 1 }, { storedValueStorage: storage }),
      muted: new KeyedStoredValue({ key: "muted", defaultValue: false }, { storedValueStorage: storage })
    });
    return (
      <LightboxDialog
        isOpen={isOpen}
        position={new Signal(undefined)}
        currentItem={currentItem}
        lightboxDetails={lightboxDetails}
        simple={simple}
        closesOnPress={closesOnPress}
        lightboxStage={lightboxStage}
        lightboxOverlayVisibility={new LightboxOverlayVisibility({ idleDelay: IDLE_DELAY, leaveDelay: LEAVE_DELAY }, scheduler)}
        inFullscreen={new Signal(false)}
        lightboxZoom={new LightboxZoom({ minimumScale: 2, maximumScale: 8 }, { currentItem, mediaSize: lightboxStage.mediaSize, enabled: new Signal(true) })}
        lightboxAutoplay={{ isPlaying: new Signal(false), countdown: new Signal(undefined) }}
        sizeObserver={new MemorySizeObserver()}
        handlers={handlers}
        keymap={{}}
        onKeydown={onKeydown}
        lightboxMouseListeners={{ onWheel: vi.fn(), onMousedown: vi.fn(), onAuxclick: vi.fn() }}
      />
    ) as HTMLDialogElement;
  });

  document.body.append(dialog);
  return { dialog, isOpen, simple, closesOnPress, scheduler, handlers, onKeydown };
}

function setupOpen(lightboxDetails?: LightboxDetails<Post>): ReturnType<typeof setup> {
  const result = setup(lightboxDetails);

  result.isOpen.value = true;
  return result;
}

function createDetails(): LightboxDetails<Post> & { isOpen: KeyedStoredValue<boolean> } {
  return {
    isOpen: new KeyedStoredValue({ key: "detailsOpen", defaultValue: false }, { storedValueStorage: new MemoryLocalKeyedValues() }),
    createContent: () => ({ bodyChild: <p>details content</p> })
  };
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
    const { dialog, onKeydown: keyListener } = setupOpen();
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

  test.each<[string, keyof CommandHandlers<LightboxCommand>]>([
    ["Previous", "showPrevious"],
    ["Next", "showNext"]
  ])("runs %s's command from its arrow", (label, lightboxCommand) => {
    const { dialog, handlers } = setupOpen();

    findButton(dialog, label).click();
    expect(handlers[lightboxCommand]).toHaveBeenCalledOnce();
  });

  test("toggles pause on a click on the video", () => {
    const { dialog, handlers } = setupOpen();

    dialog.querySelector<HTMLElement>(`.${LightboxVideoClass.root}`)!.click();
    expect(handlers.togglePause).toHaveBeenCalledOnce();
  });

  test("leaves out the details panel and its button without details", () => {
    const { dialog } = setupOpen();

    expect(dialog.querySelector(`.${LightboxDetailsPanelClass.root}`)).toBeNull();
    expect(dialog.querySelector("[aria-label=\"Details\"]")).toBeNull();
  });

  test("mounts the details content and toggles the panel from the details button", () => {
    const { dialog, handlers } = setupOpen(createDetails());

    expect(dialog.querySelector(`.${LightboxDetailsPanelClass.root}`)!.textContent).toContain("details content");
    dialog.querySelector<HTMLButtonElement>("[aria-label=\"Details\"]")!.click();
    expect(handlers.toggleDetails).toHaveBeenCalledOnce();
  });

  test("marks itself while the details panel is open", () => {
    const details = createDetails();
    const { dialog } = setupOpen(details);

    expect(dialog.hasAttribute("data-details-open")).toBe(false);
    details.isOpen.set(true);
    expect(dialog.hasAttribute("data-details-open")).toBe(true);
  });

  test("marks itself simple and gives up the details panel's room in simple mode", () => {
    const details = createDetails();
    const { dialog, simple } = setupOpen(details);

    details.isOpen.set(true);
    simple.value = true;
    expect([dialog.hasAttribute("data-simple"), dialog.hasAttribute("data-details-open")]).toEqual([true, false]);
  });

  test("closes on a press only while told to", () => {
    const { dialog, closesOnPress, handlers } = setupOpen();
    const viewport = dialog.querySelector(`.${LightboxViewportClass.root}`)!;
    const press = (): void => {
      viewport.dispatchEvent(new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 1, clientX: 10, clientY: 10 }));
    };

    press();
    expect(handlers.close).not.toHaveBeenCalled();
    closesOnPress.value = true;
    press();
    expect(handlers.close).toHaveBeenCalledOnce();
  });

  test("keeps the overlay awake while the pointer is over the details panel", () => {
    const { dialog, scheduler } = setupOpen(createDetails());

    dialog.querySelector(`.${LightboxDetailsPanelClass.root}`)!.dispatchEvent(new PointerEvent("pointerenter"));
    scheduler.advance(LEAVE_DELAY);
    expect(dialog.hasAttribute("data-idle")).toBe(false);
  });

  test("idles the overlay once the pointer leaves the details panel", () => {
    const { dialog, scheduler } = setupOpen(createDetails());
    const panel = dialog.querySelector(`.${LightboxDetailsPanelClass.root}`)!;

    panel.dispatchEvent(new PointerEvent("pointerenter"));
    panel.dispatchEvent(new PointerEvent("pointerleave"));
    scheduler.advance(IDLE_DELAY);
    expect(dialog.hasAttribute("data-idle")).toBe(true);
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
