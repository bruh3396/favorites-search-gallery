import * as FavoritesDrawer from "@/features/favorites/control/drawer";
import { FavoritesDrawerSectionName, FavoritesDrawerSectionNames } from "@/types/favorites_ui";
import { afterEach, describe, expect, test } from "vitest";
import { FavoritesConfig } from "@/config/favorites_config";
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

const SIDEBAR_LABELS_ENABLED = FavoritesConfig.drawerSidebarLabelsEnabled;

describe("FavoritesDrawer", () => {
  afterEach(() => {
    FavoritesConfig.drawerSidebarLabelsEnabled = SIDEBAR_LABELS_ENABLED;
  });

  describe("setup", () => {
    test.each(FavoritesDrawerSectionNames)("clicking the %s tab makes it the active section", (name) => {
      const { shell, preferences } = setup();

      shell.drawer[name].tab.click();
      expect(preferences.favorites.drawerActiveSection.value).toBe(name);
    });

    test("tabs show their name as a tooltip when the sidebar has no labels", () => {
      FavoritesConfig.drawerSidebarLabelsEnabled = false;
      const { shell } = setup();

      expect(shell.drawer.snippets.tab.dataset.tooltip).toBe("Snippets");
    });

    test("tabs have no tooltip when the sidebar shows labels", () => {
      FavoritesConfig.drawerSidebarLabelsEnabled = true;
      const { shell } = setup();

      expect(shell.drawer.snippets.tab.dataset.tooltip).toBeUndefined();
    });

    test("clicking the version opens the drawer on the changelog", () => {
      const { shell, preferences } = setup();

      shell.toolbar.aboutVersion.click();
      expect(readDrawerState(preferences)).toEqual({ open: true, section: "change" });
    });

    test("clicking help opens the drawer on help", () => {
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
          mount: (container) => {
            mountedInto = container;
          }, actions: [action]
        }
      });
      expect(mountedInto).toBe(shell.drawer.help.body);
      expect(shell.drawer.help.title.contains(action)).toBe(true);
    });

    test("a section can have content without actions, or actions without content", () => {
      const { shell } = setup();
      const action = document.createElement("button");
      const content = document.createElement("p");

      FavoritesDrawer.mount(shell, {
        settings: { mount: (container) => container.append(content) },
        change: { actions: [action] }
      });
      expect(shell.drawer.settings.body.contains(content)).toBe(true);
      expect(shell.drawer.change.title.contains(action)).toBe(true);
    });
  });
});
