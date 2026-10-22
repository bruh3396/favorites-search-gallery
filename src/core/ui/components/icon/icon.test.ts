import { describe, expect, test } from "vitest";
import { createIcon } from "@/core/ui/components/icon/icon";
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
});
