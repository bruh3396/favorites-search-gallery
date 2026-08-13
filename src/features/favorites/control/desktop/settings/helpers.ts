import { EnableRule, enableWhen } from "@/lib/ui/settings/enable_rule";
import { SettingsControl, toggle as toggleControl } from "@/lib/ui/settings/controls";
import { Events } from "@/app/channels/events";
import { Layout } from "@/types/app";
import { Preferences } from "@/app/context/preferences";
import { SettingsSection } from "@/features/favorites/control/desktop/settings/types";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { applyTheme } from "@/lib/ui/theme/apply";

export function toggle(config: Partial<ToggleSetting>): SettingsControl {
  return toggleControl({ registerHotkey, ...config });
}

export function whenLayout(predicate: (layout: Layout) => boolean): EnableRule {
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

export function isExpanded(section: SettingsSection): boolean {
  return Preferences.favorites.settingsExpandedSections.value[section.title] ?? section.expanded === true;
}

export function allSectionsCollapsed(sections: SettingsSection[]): boolean {
  return sections.every((section) => !isExpanded(section));
}

function registerHotkey(key: string, fire: () => void): void {
  Events.app.hotkeyPressed.on((pressed) => {
    if (pressed === key.toLowerCase()) {
      fire();
    }
  });
}
