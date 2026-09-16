import { EnableRule, enableWhen } from "@/lib/ui/settings/enable_rule";
import { SettingsControl, toggle as toggleControl } from "@/lib/ui/settings/controls";
import { applyTheme, swapNativeStylesheet } from "@/lib/ui/theme/apply";
import { Environment } from "@/app/context/environment";
import { Events } from "@/app/context/events";
import { Layout } from "@/types/app";
import { Preferences } from "@/app/context/preferences";
import { SettingsSection } from "@/features/favorites/control/settings/types";
import { ToggleSetting } from "@/lib/ui/settings/setting";

export function toggle(config: Partial<ToggleSetting>, events: Events): SettingsControl {
  return toggleControl({ registerHotkey: (key, fire) => registerHotkey(events, key, fire), ...config });
}

export function whenLayout(preferences: Preferences, predicate: (layout: Layout) => boolean): EnableRule {
  return enableWhen(preferences.favorites.layout, predicate);
}

export function whenNotInfiniteScroll(preferences: Preferences): EnableRule {
  return enableWhen(preferences.favorites.infiniteScroll, (on) => !on);
}

export function whenNotFullscreenOnHover(preferences: Preferences): EnableRule {
  return enableWhen(preferences.gallery.previewEnabled, (on) => !on);
}

export function applyCurrentTheme(preferences: Preferences): void {
  applyTheme(preferences.app.theme.value, preferences.app.darkMode.value);
}

export function applyDarkMode(preferences: Preferences, environment: Environment, dark: boolean): void {
  applyCurrentTheme(preferences);
  swapNativeStylesheet(dark, environment.onDesktopDevice);
}

export function isExpanded(preferences: Preferences, section: SettingsSection): boolean {
  return preferences.favorites.settingsExpandedSections.value[section.title] ?? section.expanded === true;
}

export function allSectionsCollapsed(preferences: Preferences, sections: SettingsSection[]): boolean {
  return sections.every((section) => !isExpanded(preferences, section));
}

function registerHotkey(events: Events, key: string, fire: () => void): void {
  events.app.hotkeyPressed.on((pressed) => {
    if (pressed === key.toLowerCase()) {
      fire();
    }
  });
}
