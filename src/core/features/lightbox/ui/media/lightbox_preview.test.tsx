import { LightboxPreview, LightboxPreviewClass } from "@/core/features/lightbox/ui/media/lightbox_preview";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import PREVIEW_CSS from "@/core/features/lightbox/ui/media/lightbox_preview.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

describe("LightboxPreview", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxPreviewClass, PREVIEW_CSS);
  });

  test("shows the given source and hides while there is none", () => {
    const src = new Signal<string | undefined>(undefined);
    const { result: image } = render(document, () => <LightboxPreview src={src} />);

    expect([image.hidden, image.getAttribute("src")]).toEqual([true, ""]);
    src.value = "https://example.com/thumb.jpg";
    expect([image.hidden, image.getAttribute("src")]).toEqual([false, "https://example.com/thumb.jpg"]);
  });

  test("hides from assistive technology as a decoration", () => {
    const { result: image } = render(document, () => <LightboxPreview src={new Signal<string | undefined>(undefined)} />);

    expect(image.getAttribute("alt")).toBe("");
  });
});
