import { LightboxImage, LightboxImageClass } from "@/core/features/lightbox/ui/media/lightbox_image";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import IMAGE_CSS from "@/core/features/lightbox/ui/media/lightbox_image.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("LightboxImage", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxImageClass, IMAGE_CSS);
  });

  test("shows the given canvas and hides while there is none", () => {
    const element = new Signal<HTMLCanvasElement | undefined>(undefined);
    const canvas = document.createElement("canvas");
    const { result: root } = render(document, () => <LightboxImage element={element} />);

    expect([root.hidden, root.childElementCount]).toEqual([true, 0]);
    element.value = canvas;
    expect(root.hidden).toBe(false);
    expect([...root.children]).toEqual([canvas]);
    element.value = undefined;
    expect([root.hidden, root.childElementCount]).toEqual([true, 0]);
  });
});
