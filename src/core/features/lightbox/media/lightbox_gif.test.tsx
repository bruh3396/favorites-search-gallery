import { LightboxGif, LightboxGifClass } from "@/core/features/lightbox/media/lightbox_gif";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import GIF_CSS from "@/core/features/lightbox/media/lightbox_gif.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("LightboxGif", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxGifClass, GIF_CSS);
  });

  test("shows the given image and hides while there is none", () => {
    const element = new Signal<HTMLImageElement | undefined>(undefined);
    const image = document.createElement("img");
    const { result: root } = render(document, () => <LightboxGif element={element} />);

    expect([root.hidden, root.childElementCount]).toEqual([true, 0]);
    element.value = image;
    expect(root.hidden).toBe(false);
    expect([...root.children]).toEqual([image]);
    element.value = undefined;
    expect([root.hidden, root.childElementCount]).toEqual([true, 0]);
  });
});
