import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { EmptyState } from "@/core/ui/components/empty_state/empty_state";
import { FAVORITES_COMMAND_LABELS } from "@/core/app/favorites/key_bindings/favorites_command_labels";
import { FAVORITES_COMMAND_SECTIONS } from "@/core/app/favorites/key_bindings/favorites_command_sections";
import { FAVORITES_KEY_BINDINGS_TOOL } from "@/core/app/favorites/key_bindings/favorites_key_bindings_tool";
import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";
import { KeyBindingList } from "@/core/ui/components/key_binding_list/key_binding_list";
import { KeyBindingListHeading } from "@/core/ui/components/key_binding_list/key_binding_list_heading";
import { KeyBindingListItem } from "@/core/ui/components/key_binding_list/key_binding_list_item";
import { KeyBindingListSection } from "@/core/ui/components/key_binding_list/key_binding_list_section";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { SearchField } from "@/core/ui/components/search_field/search_field";
import { TabList } from "@/core/ui/components/tabs/tab_list";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { formatKeyLabel } from "@/core/ui/key_bindings/key_label_formatter";
import { h } from "@/core/ui/h/h";

export const FavoritesKeyBindingsClass = {
  searchField: "fsg-FavoritesKeyBindings-searchField"
} as const;

export interface FavoritesKeyBindingsProps {
  keyBindings: Readable<KeyBindings<FavoritesCommand>>;
  resetKeyBindings: () => void;
}

export function FavoritesKeyBindings({ keyBindings, resetKeyBindings }: FavoritesKeyBindingsProps): HTMLElement {
  const selectedSectionTitle = new Signal<string>(FAVORITES_COMMAND_SECTIONS[0].title);
  const searchText = new Signal("");
  const searchWords = computed(() => searchText.value.toLowerCase().split(/\s+/u).filter(searchWord => searchWord !== ""));
  const isSearching = computed(() => searchWords.value.length > 0);
  const matchedFavoritesCommands = computed(() => new Set(FAVORITES_COMMAND_SECTIONS.flatMap(({ title, favoritesCommands }) => (
    favoritesCommands.filter(favoritesCommand => matchesSearchWords(
      searchWords.value,
      [title, FAVORITES_COMMAND_LABELS[favoritesCommand], ...keyBindings.value[favoritesCommand].map(formatKeyLabel)]
    ))
  ))));
  const isSectionShown = (title: string, favoritesCommands: readonly FavoritesCommand[]): boolean => {
    if (isSearching.value) {
      return favoritesCommands.some(favoritesCommand => matchedFavoritesCommands.value.has(favoritesCommand));
    }
    return selectedSectionTitle.value === title;
  };
  const panel = (
    <div>
      <KeyBindingList>
        {FAVORITES_COMMAND_SECTIONS.map(({ title, favoritesCommands }) => (
          <div hidden={computed(() => !isSectionShown(title, favoritesCommands))}>
            <div hidden={computed(() => !isSearching.value)}>
              <KeyBindingListHeading title={title} />
            </div>
            <KeyBindingListSection>
              {favoritesCommands.map(favoritesCommand => (
                <div hidden={computed(() => isSearching.value && !matchedFavoritesCommands.value.has(favoritesCommand))}>
                  <KeyBindingListItem
                    label={FAVORITES_COMMAND_LABELS[favoritesCommand]}
                    keys={computed(() => keyBindings.value[favoritesCommand])}
                    formatKey={formatKeyLabel}
                  />
                </div>
              ))}
            </KeyBindingListSection>
          </div>
        ))}
      </KeyBindingList>
      <div hidden={computed(() => !isSearching.value || matchedFavoritesCommands.value.size > 0)}>
        <EmptyState message={computed(() => `No shortcuts match "${searchText.value.trim()}"`)} />
      </div>
    </div>
  );
  return (
    <ViewPane
      title={FAVORITES_KEY_BINDINGS_TOOL.label}
      actions={[{ label: "Reset All Shortcuts", icon: "reset", onClick: resetKeyBindings }]}
      subheaderChild={[
        <div className={FavoritesKeyBindingsClass.searchField}>
          <SearchField
            label="Search Shortcuts"
            value={searchText}
            onValueChange={value => {
              searchText.value = value;
            }}
          />
        </div>,
        <div hidden={isSearching}>
          <TabList
            label="Sections"
            controlChoices={FAVORITES_COMMAND_SECTIONS.map(({ title }) => ({ value: title as string, label: title }))}
            value={selectedSectionTitle}
            panel={panel}
            onValueChange={title => {
              searchText.value = "";
              selectedSectionTitle.value = title;
            }}
          />
        </div>
      ]}
    >
      {panel}
    </ViewPane>
  );
}

function matchesSearchWords(searchWords: readonly string[], searchedTexts: readonly string[]): boolean {
  const searchedText = searchedTexts.join(" ").toLowerCase();
  return searchWords.every(searchWord => searchedText.includes(searchWord));
}
