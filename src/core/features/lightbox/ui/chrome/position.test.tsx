import { LightboxPosition, LightboxPositionClass } from "@/core/features/lightbox/ui/chrome/position";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import POSITION_CSS from "@/core/features/lightbox/ui/chrome/position.css?inline";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function renderPosition(position: SequencePosition | undefined): string | null {
  return render(document, () => <LightboxPosition position={new Signal(position)} />).result.textContent;
}

describe("LightboxPosition", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxPositionClass, POSITION_CSS);
  });

  test("shows the one-based position out of the total", () => {
    expect(renderPosition({ index: 2, total: 10 })).toBe("3 / 10");
  });

  test("shows only the position while the total is unknown", () => {
    expect(renderPosition({ index: 2, total: undefined })).toBe("3");
  });

  test("formats large numbers for the locale", () => {
    expect(renderPosition({ index: 999, total: 12_345 })).toBe(`${(1_000).toLocaleString()} / ${(12_345).toLocaleString()}`);
  });

  test("shows nothing without a position", () => {
    expect(renderPosition(undefined)).toBe("");
  });
});
