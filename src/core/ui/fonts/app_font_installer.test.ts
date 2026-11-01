import { afterEach, describe, expect, test, vi } from "vitest";
import { AppFont } from "@/core/ui/fonts/app_font";
import { GEIST_FONT } from "@/core/ui/fonts/geist_font";
import { INSTRUMENT_FONT } from "@/core/ui/fonts/instrument_font";
import { INTER_FONT } from "@/core/ui/fonts/inter_font";
import { PLEX_FONT } from "@/core/ui/fonts/plex_font";
import { installAppFont } from "@/core/ui/fonts/app_font_installer";

const FONT: AppFont = {
  name: "Test",
  text: "\"Text Sans\", sans-serif",
  numeric: "\"Number Mono\", monospace",
  faces: [
    { family: "Text Sans", source: "data:font/woff2;base64,AAAA", weight: "400" },
    { family: "Number Mono", source: "data:font/woff2;base64,BBBB", weight: "600" }
  ]
};

class FakeFontFace {
  constructor(public readonly family: string, public readonly source: string, public readonly descriptors: FontFaceDescriptors) { }
}

function stubFonts(): Set<unknown> {
  const fonts = new Set<unknown>();

  vi.stubGlobal("FontFace", FakeFontFace);
  Object.defineProperty(document, "fonts", { value: fonts, configurable: true });
  return fonts;
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "fonts");
});

describe("installAppFont", () => {
  test("points the root's text and numeric fonts at the font", () => {
    const root = document.createElement("div");

    stubFonts();
    installAppFont(root, FONT);
    expect(root.style.getPropertyValue("--fsg-font-family")).toBe(FONT.text);
    expect(root.style.getPropertyValue("--fsg-font-family-numeric")).toBe(FONT.numeric);
  });

  test("adds each of the font's faces to the document", () => {
    const fonts = stubFonts();

    installAppFont(document.createElement("div"), FONT);
    expect([...fonts]).toEqual([
      new FakeFontFace("Text Sans", "url(data:font/woff2;base64,AAAA)", { weight: "400" }),
      new FakeFontFace("Number Mono", "url(data:font/woff2;base64,BBBB)", { weight: "600" })
    ]);
  });

  test.each([GEIST_FONT, INSTRUMENT_FONT, INTER_FONT, PLEX_FONT])("adds only faces that $name's font stacks name", appFont => {
    const fonts = stubFonts();

    installAppFont(document.createElement("div"), appFont);
    expect([...fonts].every(fontFace => `${appFont.text}, ${appFont.numeric}`.includes((fontFace as FakeFontFace).family))).toBe(true);
  });
});
