import { LIGHTBOX_ICON_PATHS, createLightboxIcon } from "@/core/features/lightbox/overlay/lightbox_icon";
import { describe, expect, test } from "vitest";

describe("createLightboxIcon", () => {
  test("draws the icon's path in a decorative SVG with the given class", () => {
    const svg = createLightboxIcon(document, "close", "test-icon");

    expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.getAttribute("class")).toBe("test-icon");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.querySelector("path")?.getAttribute("d")).toBe(LIGHTBOX_ICON_PATHS.close);
  });

  test("fills only the filled heart", () => {
    expect(createLightboxIcon(document, "heartFilled", "test-icon").querySelector("path")?.getAttribute("fill")).toBe("currentColor");
    expect(createLightboxIcon(document, "heartPlus", "test-icon").querySelector("path")?.hasAttribute("fill")).toBe(false);
  });
});
