import { FavoritesDrawerSectionName, FavoritesDrawerSectionNames } from "@/types/favorites_ui";
import { describe, expect, test } from "vitest";
import { FavoritesDrawer } from "@/features/favorites/view/drawer";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";

interface Setup {
  drawer: FavoritesDrawer;
  shell: FavoritesShell;
}

function setup(): Setup {
  const environment = createEnvironment();
  const shell = new FavoritesShell(new Shell(), environment);
  return { drawer: new FavoritesDrawer(shell), shell };
}

function selectedTabsOf(shell: FavoritesShell): FavoritesDrawerSectionName[] {
  return FavoritesDrawerSectionNames.filter(name => shell.drawer[name].tab.dataset.selected !== undefined);
}

function visibleSectionsOf(shell: FavoritesShell): FavoritesDrawerSectionName[] {
  return FavoritesDrawerSectionNames.filter(name => shell.drawer[name].root.dataset.hidden === undefined);
}

describe("FavoritesDrawer", () => {
  test("opens and closes", () => {
    const { drawer, shell } = setup();

    drawer.toggle(true);
    expect(shell.root.dataset.drawerOpen).toBeDefined();
    drawer.toggle(false);
    expect(shell.root.dataset.drawerOpen).toBeUndefined();
  });

  test("shows only the chosen section, with its tab selected", () => {
    const { drawer, shell } = setup();

    drawer.showSection("snippets");
    drawer.showSection("help");
    expect(selectedTabsOf(shell)).toEqual(["help"]);
    expect(visibleSectionsOf(shell)).toEqual(["help"]);
  });
});
