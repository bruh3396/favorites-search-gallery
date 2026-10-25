import { describe, expect, onTestFinished, test, vi } from "vitest";
import { morph } from "@/core/features/lightbox/closer/morph";

const MORPH_DURATION = 250;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function stubFrames(): (time: number) => void {
  const queued: FrameRequestCallback[] = [];

  vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => queued.push(callback));
  onTestFinished(() => {
    vi.restoreAllMocks();
  });
  return time => queued.splice(0).forEach(callback => callback(time));
}

function moveTo(element: Element, rect: Rect): void {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ ...rect, x: rect.left, y: rect.top, right: 0, bottom: 0, toJSON: () => rect });
}

function createSource(): HTMLCanvasElement {
  const source = document.createElement("canvas");

  source.width = 600;
  source.height = 600;
  moveTo(source, { left: 10, top: 20, width: 300, height: 400 });
  return source;
}

function createTarget(): HTMLElement {
  const target = document.createElement("div");

  moveTo(target, { left: 50, top: 60, width: 100, height: 120 });
  document.body.append(target);
  onTestFinished(() => target.remove());
  return target;
}

function findStandIn(): HTMLCanvasElement | null {
  return document.body.querySelector<HTMLCanvasElement>(":scope > canvas");
}

function readVisibleBox(element: HTMLElement): number[] {
  const [left, top, width, height] = ["left", "top", "width", "height"].map(property => parseFloat(element.style.getPropertyValue(property)));
  const [translateX, translateY, scale] = (/translate\((\S+)px, (\S+)px\) scale\((\S+)\)/).exec(element.style.transform)!.slice(1).map(Number);
  const [insetTop, insetRight, insetBottom, insetLeft] = (/inset\((\S+)px (\S+)px (\S+)px (\S+)px/).exec(element.style.clipPath)!.slice(1).map(Number);
  const box = [
    left + translateX + (insetLeft * scale),
    top + translateY + (insetTop * scale),
    (width - insetLeft - insetRight) * scale,
    (height - insetTop - insetBottom) * scale
  ];
  return box.map(value => Math.round(value * 1_000) / 1_000);
}

describe("morph", () => {
  test("covers the source's drawn media with a stand-in before the page changes", () => {
    stubFrames();
    const target = createTarget();
    let standIn: HTMLCanvasElement | null = null;

    morph(createSource(), MORPH_DURATION,() => {
      standIn = findStandIn();
      return target;
    });
    onTestFinished(() => standIn?.remove());
    expect([standIn!.width, standIn!.height]).toEqual([300, 300]);
    expect(readVisibleBox(standIn!)).toEqual([10, 70, 300, 300]);
  });

  test("draws the stand-in no larger than the source's own pixels", () => {
    stubFrames();
    const source = createSource();

    source.width = 150;
    source.height = 150;
    morph(source, MORPH_DURATION, createTarget);
    const standIn = findStandIn()!;

    onTestFinished(() => standIn.remove());
    expect([standIn.width, standIn.height]).toEqual([150, 150]);
    expect(readVisibleBox(standIn)).toEqual([10, 70, 300, 300]);
  });

  test("flies the stand-in onto the target, then removes it", () => {
    const runFrame = stubFrames();

    morph(createSource(), MORPH_DURATION,createTarget);
    const standIn = findStandIn()!;

    runFrame(0);
    expect(readVisibleBox(standIn)).toEqual([10, 70, 300, 300]);
    runFrame(MORPH_DURATION);
    expect(readVisibleBox(standIn)).toEqual([50, 60, 100, 120]);
    runFrame(MORPH_DURATION + 16);
    expect(findStandIn()).toBeNull();
  });

  test("lands on the target after the given duration", () => {
    const runFrame = stubFrames();

    morph(createSource(), 100, createTarget);
    const standIn = findStandIn()!;

    runFrame(0);
    runFrame(100);
    expect(readVisibleBox(standIn)).toEqual([50, 60, 100, 120]);
    runFrame(116);
    expect(findStandIn()).toBeNull();
  });

  test("hides the target during the flight and restores its visibility on landing", () => {
    const runFrame = stubFrames();
    const target = createTarget();

    target.style.setProperty("visibility", "visible", "important");
    morph(createSource(), MORPH_DURATION,() => target);
    runFrame(0);
    expect(target.style.visibility).toBe("hidden");
    runFrame(MORPH_DURATION);
    runFrame(MORPH_DURATION + 16);
    expect([target.style.visibility, target.style.getPropertyPriority("visibility")]).toEqual(["visible", "important"]);
  });

  test("flies to an SVG target without changing its visibility", () => {
    const runFrame = stubFrames();
    const target = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    document.body.append(target);

    morph(createSource(), MORPH_DURATION,() => target);
    runFrame(0);

    expect(target.getAttribute("visibility")).toBeNull();

    runFrame(MORPH_DURATION);
    runFrame(MORPH_DURATION + 16);

    expect(findStandIn()).toBeNull();
  });

  test("restores the target's visibility when it leaves the page mid-flight", () => {
    const runFrame = stubFrames();
    const target = createTarget();

    morph(createSource(), MORPH_DURATION,() => target);
    runFrame(0);
    target.remove();
    runFrame(MORPH_DURATION / 2);
    expect(target.style.visibility).toBe("");
  });

  test("lands on the target where it is now when it moves mid-flight", () => {
    const runFrame = stubFrames();
    const target = createTarget();

    morph(createSource(), MORPH_DURATION,() => target);
    const standIn = findStandIn()!;

    onTestFinished(() => standIn.remove());
    runFrame(0);
    moveTo(target, { left: 50, top: -500, width: 100, height: 120 });
    runFrame(MORPH_DURATION);
    expect(readVisibleBox(standIn)).toEqual([50, -500, 100, 120]);
  });

  test("narrows the stand-in from the viewport to the target's nearest clipping ancestor", () => {
    const runFrame = stubFrames();
    const pane = document.createElement("div");
    const wrapper = document.createElement("div");
    const target = createTarget();

    pane.style.overflow = "hidden";
    wrapper.style.overflow = "visible";
    wrapper.append(target);
    pane.append(wrapper);
    document.body.append(pane);
    onTestFinished(() => pane.remove());
    moveTo(pane, { left: 0, top: 100, width: 400, height: 400 });
    morph(createSource(), MORPH_DURATION,() => target);
    const standIn = findStandIn()!;

    runFrame(0);
    expect(readVisibleBox(standIn)).toEqual([10, 70, 300, 300]);
    runFrame(MORPH_DURATION);
    expect(readVisibleBox(standIn)).toEqual([50, 100, 100, 80]);
    runFrame(MORPH_DURATION + 16);
  });

  test("drops the stand-in when the target leaves the page mid-flight", () => {
    const runFrame = stubFrames();
    const target = createTarget();

    morph(createSource(), MORPH_DURATION,() => target);
    runFrame(0);
    target.remove();
    runFrame(MORPH_DURATION / 2);
    expect(findStandIn()).toBeNull();
  });

  test("drops the stand-in as the page changes when there is no target", () => {
    stubFrames();

    morph(createSource(), MORPH_DURATION,() => undefined);
    expect(findStandIn()).toBeNull();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  test("updates the page without a stand-in when the source has nothing drawn yet", () => {
    stubFrames();
    const update = vi.fn(() => undefined);

    morph(document.createElement("img"), MORPH_DURATION, update);
    expect(update).toHaveBeenCalledOnce();
    expect(findStandIn()).toBeNull();
  });

  test("updates the page without a stand-in when the video has no frame yet", () => {
    stubFrames();
    const update = vi.fn(() => undefined);
    const video = Object.defineProperties(document.createElement("video"), { videoWidth: { value: 0 }, videoHeight: { value: 0 } });

    morph(video, MORPH_DURATION, update);
    expect(update).toHaveBeenCalledOnce();
    expect(findStandIn()).toBeNull();
  });
});
