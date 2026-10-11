import { afterEach, describe, expect, test } from "vitest";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";

describe("BrowserHostPage", () => {
  afterEach(() => {
    document.body.style.overflowX = "";
    document.documentElement.style.width = "";
  });

  test("gives the app an element of its own at the end of the body", () => {
    const content = new BrowserHostPage().claimContent();

    expect(document.body.lastElementChild).toBe(content);
    content.remove();
  });

  test("lays the page out at full viewport width so the scrollbar overlays it", () => {
    new BrowserHostPage().claimContent().remove();
    expect(document.documentElement.style.width).toBe("100vw");
    expect(document.body.style.overflowX).toBe("clip");
  });

});
