import { ICON_PATHS, Icon, createIcon } from "@/core/ui/components/icon/icon";
import { describe, expect, test } from "vitest";
import { Signal } from "@/core/utils/reactive/signal";
import { render } from "@/core/ui/h/h";

describe("createIcon", () => {
  test("creates the icon in the document being rendered", () => {
    const ownerDocument = document.implementation.createHTMLDocument();
    const { result: icon } = render(ownerDocument, () => createIcon("close", "icon"));

    expect(icon.ownerDocument).toBe(ownerDocument);
  });

  test("hides the icon from assistive technology", () => {
    const { result: icon } = render(document, () => createIcon("close", "icon"));

    expect(icon.getAttribute("aria-hidden")).toBe("true");
  });

  test("redraws as the icon it is given changes", () => {
    const name = new Signal<Icon>("expandAll");
    const { result: icon } = render(document, () => createIcon(name, "icon"));
    const readPath = (): string | null => icon.querySelector("path")!.getAttribute("d");
    const expandPath = readPath();

    name.value = "collapseAll";
    expect(readPath()).not.toBe(expandPath);
    name.value = "expandAll";
    expect(readPath()).toBe(expandPath);
  });

  test("draws the icon's path with the given class", () => {
    const { result: icon } = render(document, () => createIcon("close", "icon"));

    expect([icon.getAttribute("class"), icon.querySelector("path")!.getAttribute("d")]).toEqual(["icon", ICON_PATHS.close]);
  });

  test("fills only a filled icon, also as the icon changes", () => {
    const name = new Signal<Icon>("heartFilled");
    const { result: icon } = render(document, () => createIcon(name, "icon"));
    const readFill = (): string | null => icon.querySelector("path")!.getAttribute("fill");
    const filledFill = readFill();

    name.value = "heartPlus";
    expect([filledFill, readFill()]).toEqual(["currentColor", null]);
  });
});
