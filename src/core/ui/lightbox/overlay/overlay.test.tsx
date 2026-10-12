import { LightboxOverlay, LightboxOverlayClass } from "@/core/ui/lightbox/overlay/overlay";
import { describe, expect, onTestFinished, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import OVERLAY_CSS from "@/core/ui/lightbox/overlay/overlay.css?inline";
import { OverlayVisibility } from "@/core/ui/lightbox/overlay/visibility";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  overlay: HTMLElement;
  visibility: OverlayVisibility;
  scheduler: MemoryScheduler;
  controls: Record<"topStart" | "topEnd" | "start" | "end", HTMLElement>;
}

function setup(): Setup {
  const scheduler = new MemoryScheduler();
  const visibility = new OverlayVisibility({ idleDelay: 2_000, shortDelay: 1_000 }, scheduler);
  const controls = {
    topStart: document.createElement("button"),
    topEnd: document.createElement("button"),
    start: document.createElement("button"),
    end: document.createElement("button")
  };
  const { result, dispose } = render(document, () => <LightboxOverlay visibility={visibility} {...controls} />);

  document.body.append(result);
  onTestFinished(() => {
    dispose();
    result.remove();
  });
  return { overlay: result, visibility, scheduler, controls };
}

describe("LightboxOverlay", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxOverlayClass, OVERLAY_CSS);
  });

  test("places each control in its slot", () => {
    const { controls } = setup();

    expect([
      controls.topStart.parentElement!.classList.contains(LightboxOverlayClass.topStart),
      controls.topEnd.parentElement!.classList.contains(LightboxOverlayClass.topEnd),
      controls.start.parentElement!.classList.contains(LightboxOverlayClass.start),
      controls.end.parentElement!.classList.contains(LightboxOverlayClass.end)
    ]).toEqual([true, true, true, true]);
  });

  test("marks itself shown or hidden with its visibility", () => {
    const { overlay, visibility } = setup();

    expect(overlay.dataset.shown).toBe("false");
    visibility.show();
    expect(overlay.dataset.shown).toBe("true");
  });

  test("stays shown while the pointer is on a slot", () => {
    const { overlay, visibility, scheduler, controls } = setup();

    visibility.show();
    controls.topEnd.parentElement!.dispatchEvent(new PointerEvent("pointerenter"));
    scheduler.advance(10_000);
    expect(overlay.dataset.shown).toBe("true");
  });

  test("hides once idle after the pointer leaves a slot", () => {
    const { overlay, visibility, scheduler, controls } = setup();
    const slot = controls.start.parentElement!;

    visibility.show();
    slot.dispatchEvent(new PointerEvent("pointerenter"));
    slot.dispatchEvent(new PointerEvent("pointerleave"));
    scheduler.advance(2_000);
    expect(overlay.dataset.shown).toBe("false");
  });

  test("keeps clicks on its controls from reaching what lies under it", () => {
    const { overlay, controls } = setup();
    const container = document.createElement("div");
    let clicks = 0;

    container.append(overlay);
    container.addEventListener("click", () => {
      clicks += 1;
    });
    controls.end.click();
    expect(clicks).toBe(0);
  });
});
