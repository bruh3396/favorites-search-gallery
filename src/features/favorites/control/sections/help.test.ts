import * as FavoritesHelp from "@/features/favorites/control/sections/help";
import { describe, expect, test, vi } from "vitest";
import { createEnvironment } from "@/testing/environment";

interface Setup {
  container: HTMLElement;
  requestTutorial: () => void;
}

function setup(onMobileDevice: boolean): Setup {
  const container = document.createElement("div");
  const requestTutorial = vi.fn();
  const environment = createEnvironment({ onMobileDevice, onDesktopDevice: !onMobileDevice });

  FavoritesHelp.buildDrawerSection(environment, requestTutorial).mount?.(container);
  return { container, requestTutorial };
}

describe("FavoritesHelp", () => {
  test("on mobile, a button shows the gallery controls", () => {
    const { container, requestTutorial } = setup(true);

    (container.querySelector("button") as HTMLButtonElement).click();
    expect(requestTutorial).toHaveBeenCalledOnce();
  });

  test("on desktop, there is no gallery controls button", () => {
    const { container } = setup(false);

    expect(container.querySelector("button")).toBeNull();
  });

  test("every link opens in a new tab without giving it access to this page", () => {
    const { container } = setup(false);
    const links = [...container.querySelectorAll("a")];

    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(link.target).toBe("_blank");
      expect(link.rel.split(" ")).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
    }
  });
});
