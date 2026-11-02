import { LightboxFrame, LightboxFrameClass } from "@/core/features/lightbox/lightbox_frame";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import FRAME_CSS from "@/core/features/lightbox/lightbox_frame.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("LightboxFrame", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxFrameClass, FRAME_CSS);
  });

  test("places its content", () => {
    const { result: frame } = render(document, () => <LightboxFrame contentChild={<span>content</span>} />);

    expect(frame.textContent).toBe("content");
  });
});
