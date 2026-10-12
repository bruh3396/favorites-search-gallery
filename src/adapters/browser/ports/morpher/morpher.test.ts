import { BrowserMorpher, MORPH_DURATION } from "@/adapters/browser/ports/morpher/morpher";
import { describe, expect, onTestFinished, test, vi } from "vitest";

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

function readPlacement(element: HTMLElement): string[] {
  return ["left", "top", "width", "height"].map(property => element.style.getPropertyValue(property));
}

describe("BrowserMorpher", () => {
  test("covers the source's drawn media with a stand-in before the page changes", () => {
    stubFrames();
    const target = createTarget();
    let standIn: HTMLCanvasElement | null = null;

    new BrowserMorpher().morph(createSource(), () => {
      standIn = findStandIn();
      return target;
    });
    onTestFinished(() => standIn?.remove());
    expect([standIn!.width, standIn!.height]).toEqual([600, 600]);
    expect(readPlacement(standIn!)).toEqual(["10px", "70px", "300px", "300px"]);
  });

  test("flies the stand-in onto the target, then removes it", () => {
    const runFrame = stubFrames();

    new BrowserMorpher().morph(createSource(), createTarget);
    const standIn = findStandIn()!;

    runFrame(0);
    expect(readPlacement(standIn)).toEqual(["10px", "70px", "300px", "300px"]);
    runFrame(MORPH_DURATION);
    expect(readPlacement(standIn)).toEqual(["50px", "60px", "100px", "120px"]);
    runFrame(MORPH_DURATION + 16);
    expect(findStandIn()).toBeNull();
  });

  test("lands on the target where it is now when it moves mid-flight", () => {
    const runFrame = stubFrames();
    const target = createTarget();

    new BrowserMorpher().morph(createSource(), () => target);
    const standIn = findStandIn()!;

    onTestFinished(() => standIn.remove());
    runFrame(0);
    moveTo(target, { left: 50, top: -500, width: 100, height: 120 });
    runFrame(MORPH_DURATION);
    expect(readPlacement(standIn)).toEqual(["50px", "-500px", "100px", "120px"]);
  });

  test("drops the stand-in when the target leaves the page mid-flight", () => {
    const runFrame = stubFrames();
    const target = createTarget();

    new BrowserMorpher().morph(createSource(), () => target);
    runFrame(0);
    target.remove();
    runFrame(MORPH_DURATION / 2);
    expect(findStandIn()).toBeNull();
  });

  test("drops the stand-in as the page changes when there is no target", () => {
    stubFrames();

    new BrowserMorpher().morph(createSource(), () => undefined);
    expect(findStandIn()).toBeNull();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  test("updates the page without a stand-in when the source has nothing drawn yet", () => {
    stubFrames();
    const update = vi.fn(() => undefined);

    new BrowserMorpher().morph(document.createElement("img"), update);
    expect(update).toHaveBeenCalledOnce();
    expect(findStandIn()).toBeNull();
  });

  test("updates the page without a stand-in when the video has no frame yet", () => {
    stubFrames();
    const update = vi.fn(() => undefined);
    const video = Object.defineProperties(document.createElement("video"), { videoWidth: { value: 0 }, videoHeight: { value: 0 } });

    new BrowserMorpher().morph(video, update);
    expect(update).toHaveBeenCalledOnce();
    expect(findStandIn()).toBeNull();
  });
});
