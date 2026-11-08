import { LightboxDialog, LightboxDialogClass, LightboxDialogProps } from "@/core/features/lightbox/lightbox_dialog";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import DIALOG_CSS from "@/core/features/lightbox/lightbox_dialog.css?inline";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay/lightbox_overlay_visibility";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

const IDLE_DELAY = 100;
const LEAVE_DELAY = 500;

function setup(detailsOpen?: Signal<boolean>): {
  dialog: HTMLDialogElement;
  isOpen: Signal<boolean>;
  simple: Signal<boolean>;
  scheduler: MemoryScheduler;
  handlers: LightboxDialogProps["handlers"];
  focusMedia: () => void;
} {
  const isOpen = new Signal(false);
  const simple = new Signal(false);
  const scheduler = new MemoryScheduler();
  const handlers = { close: vi.fn() };
  let focusMedia = (): void => undefined;
  const { result: dialog } = render(document, () => (
    <LightboxDialog
      isOpen={isOpen}
      simple={simple}
      detailsOpen={detailsOpen}
      lightboxOverlayVisibility={new LightboxOverlayVisibility({ idleDelay: IDLE_DELAY, leaveDelay: LEAVE_DELAY }, scheduler)}
      handlers={handlers}
      lightboxMouseListeners={{ onWheel: vi.fn(), onMousedown: vi.fn(), onAuxclick: vi.fn() }}
      renderFrame={onMediaFocus => {
        focusMedia = onMediaFocus;
        return <div>frame</div>;
      }}
    />
  ) as HTMLDialogElement);

  document.body.append(dialog);
  return { dialog, isOpen, simple, scheduler, handlers, focusMedia };
}

function setupOpen(detailsOpen?: Signal<boolean>): ReturnType<typeof setup> {
  const result = setup(detailsOpen);

  result.isOpen.value = true;
  return result;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("LightboxDialog", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxDialogClass, DIALOG_CSS);
  });

  test("places its frame", () => {
    const { dialog } = setup();

    expect(dialog.textContent).toContain("frame");
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

  test("marks itself while the details panel is open", () => {
    const detailsOpen = new Signal(false);
    const { dialog } = setupOpen(detailsOpen);

    expect(dialog.hasAttribute("data-details-open")).toBe(false);
    detailsOpen.value = true;
    expect(dialog.hasAttribute("data-details-open")).toBe(true);
  });

  test("marks itself simple and gives up the details panel's room in simple mode", () => {
    const { dialog, simple } = setupOpen(new Signal(true));

    simple.value = true;
    expect([dialog.hasAttribute("data-simple"), dialog.hasAttribute("data-details-open")]).toEqual([true, false]);
  });

  test("takes focus back when the frame reports focus moving into its media", () => {
    const { dialog, focusMedia } = setupOpen();
    const other = document.createElement("button");

    document.body.append(other);
    other.focus();
    focusMedia();
    expect(document.activeElement).toBe(dialog);
  });
});
