import { afterEach, describe, expect, test } from "vitest";
import { claimBodyContent } from "@/adapters/browser/document/body_content_claimer";

describe("claimBodyContent", () => {
  afterEach(() => {
    document.body.style.overflowX = "";
    document.documentElement.style.width = "";
  });

  test("gives the app an element of its own at the end of the body", () => {
    const content = claimBodyContent();

    expect(document.body.lastElementChild).toBe(content);
    content.remove();
  });

  test("lays the page out at full viewport width so the scrollbar overlays it", () => {
    claimBodyContent().remove();
    expect(document.documentElement.style.width).toBe("100vw");
    expect(document.body.style.overflowX).toBe("clip");
  });

});
