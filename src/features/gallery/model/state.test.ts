import { describe, expect, test } from "vitest";
import { GalleryStateController } from "@/features/gallery/model/state";

function createOpenController(): GalleryStateController {
  const controller = new GalleryStateController(false);

  controller.open();
  return controller;
}

describe("GalleryStateController", () => {
  test("starts in the preview state when previews are enabled", () => {
    const controller = new GalleryStateController(true);

    expect(controller.currentState).toBe("preview");
    expect(controller.isShowingPreviews).toBe(true);
    expect(controller.isIdle).toBe(false);
    expect(controller.isInGallery).toBe(false);
  });

  test("starts in the idle state when previews are disabled", () => {
    const controller = new GalleryStateController(false);

    expect(controller.currentState).toBe("idle");
    expect(controller.isIdle).toBe(true);
  });

  test("moves to the open state on open", () => {
    const controller = new GalleryStateController(false);

    controller.open();

    expect(controller.currentState).toBe("open");
    expect(controller.isInGallery).toBe(true);
  });

  test("moves to the idle state on close", () => {
    const controller = createOpenController();

    controller.close();

    expect(controller.currentState).toBe("idle");
    expect(controller.isIdle).toBe(true);
  });

  test("moves from idle to the preview state when previews turn on", () => {
    const controller = new GalleryStateController(false);

    controller.preview(true);

    expect(controller.currentState).toBe("preview");
    expect(controller.isShowingPreviews).toBe(true);
  });

  test("moves from preview to the idle state when previews turn off", () => {
    const controller = new GalleryStateController(true);

    controller.preview(false);

    expect(controller.currentState).toBe("idle");
    expect(controller.isIdle).toBe(true);
  });

  test("ignores previews turning on or off while open", () => {
    const controller = createOpenController();

    controller.preview(true);
    expect(controller.currentState).toBe("open");

    controller.preview(false);
    expect(controller.currentState).toBe("open");
  });
});
