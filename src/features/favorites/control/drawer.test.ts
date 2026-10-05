import * as FavoritesDrawer from "@/features/favorites/control/drawer";
import { FavoritesDrawerSectionName, FavoritesDrawerSectionNames } from "@/types/favorites_ui";
import { describe, expect, test } from "vitest";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";
import { createPreferences } from "@/testing/preferences";

interface Setup {
  shell: FavoritesShell;
  preferences: Preferences;
}

function setup(): Setup {
  const environment = createEnvironment();
  const shell = new FavoritesShell(environment, new Shell());
  const preferences = createPreferences({ favorites: { drawerOpen: false, drawerActiveSection: "settings" } });

  FavoritesDrawer.setup(preferences, shell);
  return { shell, preferences };
}

function readDrawerState(preferences: Preferences): { open: boolean; section: FavoritesDrawerSectionName } {
  return { open: preferences.favorites.drawerOpen.value, section: preferences.favorites.drawerActiveSection.value };
}

describe("FavoritesDrawer", () => {
  describe("setup", () => {
    test.each(FavoritesDrawerSectionNames)("makes the %s tab the active section when it is clicked", name => {
      const { shell, preferences } = setup();

      shell.drawer[name].tab.click();
      expect(preferences.favorites.drawerActiveSection.value).toBe(name);
    });

    test("opens the drawer on the changelog when the version is clicked", () => {
      const { shell, preferences } = setup();

      shell.toolbar.aboutVersion.click();
      expect(readDrawerState(preferences)).toEqual({ open: true, section: "change" });
    });

    test("opens the drawer on help when help is clicked", () => {
      const { shell, preferences } = setup();

      shell.toolbar.aboutHelp.click();
      expect(readDrawerState(preferences)).toEqual({ open: true, section: "help" });
    });
  });

  describe("mount", () => {
    test("mounts each section's content into its body and its actions into its title", () => {
      const { shell } = setup();
      const action = document.createElement("button");
      let mountedInto: HTMLElement | null = null;

      FavoritesDrawer.mount(shell, {
        help: {
          mount: container => {
            mountedInto = container;
          }, actions: [action]
        }
      });
      expect(mountedInto).toBe(shell.drawer.help.body);
      expect(shell.drawer.help.title.contains(action)).toBe(true);
    });

    test("mounts a section's content without actions, or its actions without content", () => {
      const { shell } = setup();
      const action = document.createElement("button");
      const content = document.createElement("p");

      FavoritesDrawer.mount(shell, {
        settings: { mount: container => container.append(content) },
        change: { actions: [action] }
      });
      expect(shell.drawer.settings.body.contains(content)).toBe(true);
      expect(shell.drawer.change.title.contains(action)).toBe(true);
    });
  });
});
