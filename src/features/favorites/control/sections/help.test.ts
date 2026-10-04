import * as FavoritesHelp from "@/features/favorites/control/sections/help";
import { describe, expect, test, vi } from "vitest";

interface Setup {
  container: HTMLElement;
  requestTutorial: () => void;
}

function setup(offersTutorial: boolean): Setup {
  const container = document.createElement("div");
  const requestTutorial = vi.fn();

  FavoritesHelp.buildDrawerSection(offersTutorial, requestTutorial).mount?.(container);
  return { container, requestTutorial };
}

describe("FavoritesHelp", () => {
  test("offers the gallery controls tutorial", () => {
    const { container, requestTutorial } = setup(true);

    (container.querySelector("button") as HTMLButtonElement).click();
    expect(requestTutorial).toHaveBeenCalledOnce();
  });

  test("doesn't offer the gallery controls tutorial", () => {
    const { container } = setup(false);

    expect(container.querySelector("button")).toBeNull();
  });

  test("opens every link in a new tab without giving it access to this page", () => {
    const { container } = setup(false);
    const links = [...container.querySelectorAll("a")];

    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(link.target).toBe("_blank");
      expect(link.rel.split(" ")).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
    }
  });
});
