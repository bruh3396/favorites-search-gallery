import { EnableRule, enableWhen } from "@/lib/ui/settings/enable_rule";
import { SettingsControl, toggle as toggleControl } from "@/lib/ui/settings/controls";
import { DomEvents } from "@/app/dom/events";
import { Layout } from "@/types/app";
import { Preferences } from "@/app/context/preferences";
import { SettingsSection } from "@/features/favorites/control/desktop/settings/types";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { applyTheme } from "@/lib/ui/theme/apply";
import { galleryOpened } from "@/app/channels/feature_bridge";

export function toggle(config: Partial<ToggleSetting>): SettingsControl {
  return toggleControl({ registerHotkey, ...config });
}

export function onLayout(predicate: (layout: Layout) => boolean): EnableRule {
  return enableWhen(Preferences.favorites.layout, predicate);
}

export function whenNotInfiniteScroll(): EnableRule {
  return enableWhen(Preferences.favorites.infiniteScroll, (on) => !on);
}

export function whenNotFullscreenOnHover(): EnableRule {
  return enableWhen(Preferences.gallery.previewEnabled, (on) => !on);
}

export function applyCurrentTheme(): void {
  applyTheme(Preferences.app.theme.value, Preferences.app.darkMode.value);
}

export function isCollapsed(title: string): boolean {
  return Preferences.favorites.settingsCollapsedSections.value[title] === true;
}

export function allSectionsCollapsed(sections: SettingsSection[]): boolean {
  return sections.every(({ title }) => isCollapsed(title));
}

function registerHotkey(key: string, fire: () => void): void {
  DomEvents.document.keydown.on((event) => {
    if (event.isHotkey && event.key.toLowerCase() === key.toLowerCase() && !galleryOpened()) {
      fire();
    }
  });
}
