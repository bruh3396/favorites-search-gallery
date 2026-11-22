import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { Confirmer } from "@/core/boundary/ports/confirmer/confirmer";
import { FAVORITES_COMMAND_LABELS } from "@/core/app/favorites/key_bindings/favorites_command_labels";
import { FAVORITES_COMMAND_SECTIONS } from "@/core/app/favorites/key_bindings/favorites_command_sections";
import { FAVORITES_KEY_BINDINGS_TOOL } from "@/core/app/favorites/key_bindings/favorites_key_bindings_tool";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { KeyBindingList } from "@/core/ui/components/key_binding_list/key_binding_list";
import { KeyBindingListItem } from "@/core/ui/components/key_binding_list/key_binding_list_item";
import { KeyBindingListSection } from "@/core/ui/components/key_binding_list/key_binding_list_section";
import { KeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { TabList } from "@/core/ui/components/tabs/tab_list";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { formatKeyLabel } from "@/core/ui/key_bindings/key_label_formatter";
import { h } from "@/core/ui/h/h";

export interface FavoritesKeyBindingsDependencies {
  keyBindings: Readable<KeyBindings<FavoritesCommand>>;
  keyBindingOverrides: Pick<StoredValue<KeyBindingOverrides<FavoritesCommand>>, "set">;
  confirmer: Confirmer;
}

export function composeFavoritesKeyBindings(dependencies: FavoritesKeyBindingsDependencies): HTMLElement {
  const { keyBindings, keyBindingOverrides, confirmer } = dependencies;
  const resetKeyBindings = (): void => {
    if (confirmer.confirm("Reset all keyboard shortcuts to their defaults?")) {
      keyBindingOverrides.set({});
    }
  };
  const selectedSectionTitle = new Signal<string>(FAVORITES_COMMAND_SECTIONS[0].title);
  const panel = h("div", {}, h(KeyBindingList, {}, FAVORITES_COMMAND_SECTIONS.map(({ title, favoritesCommands }) => h(
    "div",
    { hidden: computed(() => selectedSectionTitle.value !== title) },
    h(KeyBindingListSection, {}, favoritesCommands.map(favoritesCommand => h(KeyBindingListItem, {
      label: FAVORITES_COMMAND_LABELS[favoritesCommand],
      keys: computed(() => keyBindings.value[favoritesCommand]),
      formatKey: formatKeyLabel
    })))
  ))));
  return h(ViewPane, {
    title: FAVORITES_KEY_BINDINGS_TOOL.label,
    actions: [{ label: "Reset All Shortcuts", icon: "reset", onClick: resetKeyBindings }],
    subheaderChild: h(TabList<string>, {
      label: "Sections",
      controlChoices: FAVORITES_COMMAND_SECTIONS.map(({ title }) => ({ value: title, label: title })),
      value: selectedSectionTitle,
      panel,
      onValueChange: (title): void => {
        selectedSectionTitle.value = title;
      }
    })
  }, panel);
}
