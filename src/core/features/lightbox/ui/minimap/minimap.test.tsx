import { LightboxMinimap, LightboxMinimapClass } from "@/core/features/lightbox/ui/minimap/minimap";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import MINIMAP_CSS from "@/core/features/lightbox/ui/minimap/minimap.css?inline";
import { MorphSource } from "@/core/boundary/ports/morpher/morpher";
import { Signal } from "@/core/utils/reactive/signal";
import { ZoomRegion } from "@/core/features/lightbox/zoom/zoom";
import { expectClassesStyled } from "@/testing/css";

const REGION: ZoomRegion = { left: 0.25, top: 0.5, width: 0.5, height: 0.25 };

interface Setup {
  minimap: HTMLElement;
  region: Signal<ZoomRegion | undefined>;
  drawImage: Mock<(media: CanvasImageSource, x: number, y: number, width: number, height: number) => void>;
}

function createImage(width: number, height: number): HTMLImageElement {
  const image = document.createElement("img");

  Object.defineProperties(image, { naturalWidth: { value: width }, naturalHeight: { value: height } });
  return image;
}

function setup(media: MorphSource | undefined): Setup {
  const region = new Signal<ZoomRegion | undefined>(undefined);
  const drawImage: Setup["drawImage"] = vi.fn();
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  const { result, dispose } = render(document, () => <LightboxMinimap region={region} readShownMedia={() => media} />);

  onTestFinished(() => {
    dispose();
    getContext.mockRestore();
  });
  return { minimap: result, region, drawImage };
}

function findPart(minimap: HTMLElement, className: string): HTMLElement {
  return minimap.querySelector<HTMLElement>(`.${className}`)!;
}

describe("LightboxMinimap", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxMinimapClass, MINIMAP_CSS);
  });

  test("hides while fitted", () => {
    const { minimap, region } = setup(createImage(100, 100));

    expect(minimap.hidden).toBe(true);
    region.value = REGION;
    region.value = undefined;
    expect(minimap.hidden).toBe(true);
  });

  test("outlines the part of the image in view", () => {
    const { minimap, region } = setup(createImage(100, 100));
    const box = findPart(minimap, LightboxMinimapClass.region);

    region.value = REGION;
    expect([minimap.hidden, box.style.left, box.style.top, box.style.width, box.style.height]).toEqual([false, "25%", "50%", "50%", "25%"]);
  });

  test("draws the shown media shrunk to a thumbnail once per zoom", () => {
    const image = createImage(2_000, 1_000);
    const { minimap, region, drawImage } = setup(image);
    const canvas = findPart(minimap, LightboxMinimapClass.image) as HTMLCanvasElement;

    region.value = REGION;
    region.value = { ...REGION, left: 0 };
    expect(drawImage.mock.calls).toEqual([[image, 0, 0, canvas.width, canvas.height]]);
    expect(canvas.width / canvas.height).toBe(2);
    expect(canvas.width).toBeLessThan(2_000);
  });

  test("draws a small image at its own size", () => {
    const { minimap, region } = setup(createImage(30, 20));
    const canvas = findPart(minimap, LightboxMinimapClass.image) as HTMLCanvasElement;

    region.value = REGION;
    expect([canvas.width, canvas.height]).toEqual([30, 20]);
  });

  test("stays up without a thumbnail where the canvas can't draw", () => {
    const { minimap, region } = setup(createImage(30, 20));

    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    region.value = REGION;
    expect(minimap.hidden).toBe(false);
  });

  test("draws nothing while no media is shown", () => {
    const { region, drawImage } = setup(undefined);

    region.value = REGION;
    expect(drawImage).not.toHaveBeenCalled();
  });
});
