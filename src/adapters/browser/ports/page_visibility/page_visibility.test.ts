import { describe, expect, test } from "vitest";
import { BrowserPageVisibility } from "@/adapters/browser/ports/page_visibility/page_visibility";

function setup(): { changeVisibility: (state: DocumentVisibilityState) => void; hides: () => number } {
  const document = window.document.implementation.createHTMLDocument();
  let visibilityState: DocumentVisibilityState = "visible";
  let hides = 0;

  Object.defineProperty(document, "visibilityState", { get: () => visibilityState });
  new BrowserPageVisibility(document).hidden.on(() => {
    hides += 1;
  });
  return {
    changeVisibility: (state): void => {
      visibilityState = state;
      document.dispatchEvent(new Event("visibilitychange"));
    },
    hides: () => hides
  };
}

describe("BrowserPageVisibility", () => {
  describe("hidden", () => {
    test("emits when the page becomes hidden", () => {
      const { changeVisibility, hides } = setup();

      changeVisibility("hidden");
      expect(hides()).toBe(1);
    });

    test("ignores the page becoming visible", () => {
      const { changeVisibility, hides } = setup();

      changeVisibility("visible");
      expect(hides()).toBe(0);
    });
  });
});
