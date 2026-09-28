import { describe, expect, test } from "vitest";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";

interface Setup {
  appShell: Shell;
  shell: FavoritesShell;
}

function setup(): Setup {
  const environment = createEnvironment({ version: "9.9.9" });
  const appShell = new Shell();
  return { appShell, shell: new FavoritesShell(appShell, environment) };
}

function slotsOf(shell: FavoritesShell): HTMLElement[] {
  const drawerSlots = Object.values(shell.drawer).flatMap(({ tab, root, title, body }) => [tab, root, title, body]);
  return [...Object.values(shell.toolbar), ...drawerSlots];
}

describe("FavoritesShell", () => {
  test("mounts every slot it hands out inside the app shell", () => {
    const { appShell, shell } = setup();

    for (const slot of slotsOf(shell)) {
      expect(appShell.root.contains(slot)).toBe(true);
    }
  });

  test("hands out a distinct element for every slot", () => {
    const slots = slotsOf(setup().shell);

    expect(new Set(slots).size).toBe(slots.length);
  });

  test("keeps the app shell's content between its scroll sentinels, in order", () => {
    const { appShell, shell } = setup();
    const { scrollSentinelTop, content, scrollSentinelBottom } = appShell;

    expect(shell.root.contains(content)).toBe(true);
    expect(scrollSentinelTop.nextElementSibling).toBe(content);
    expect(content.nextElementSibling).toBe(scrollSentinelBottom);
  });

  test("shows the environment's version", () => {
    const { shell } = setup();

    expect(shell.toolbar.aboutVersion.textContent).toContain("9.9.9");
  });
});
