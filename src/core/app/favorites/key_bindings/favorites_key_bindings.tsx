import { Signal, computed } from "@/core/utils/reactive/signal";
import { containsEverySearchWord, splitSearchWords } from "@/core/utils/string/string_utilities";
import { EmptyState } from "@/core/ui/components/empty_state/empty_state";
import { FAVORITES_TOOL_DEFINITIONS } from "@/core/app/favorites/favorites_tool";
import { FavoritesKeyBindingsRow } from "@/core/app/favorites/key_bindings/favorites_key_bindings_row";
import { FavoritesKeyBindingsSection } from "@/core/app/favorites/key_bindings/favorites_key_bindings_section";
import { KeyBindingList } from "@/core/ui/components/key_binding_list/key_binding_list";
import { KeyBindingListHeading } from "@/core/ui/components/key_binding_list/key_binding_list_heading";
import { KeyBindingListItem } from "@/core/ui/components/key_binding_list/key_binding_list_item";
import { KeyBindingListSection } from "@/core/ui/components/key_binding_list/key_binding_list_section";
import { SearchField } from "@/core/ui/components/search_field/search_field";
import { TabList } from "@/core/ui/components/tabs/tab_list";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { formatKeyLabel } from "@/core/ui/key_bindings/key_label_formatter";
import { h } from "@/core/ui/h/h";

export interface FavoritesKeyBindingsProps {
  sections: readonly FavoritesKeyBindingsSection[];
  resetKeyBindings: () => void;
}

export function FavoritesKeyBindings({ sections: favoritesKeyBindingsSections, resetKeyBindings }: FavoritesKeyBindingsProps): HTMLElement {
  const selectedSectionTitle = new Signal<string>(favoritesKeyBindingsSections[0].title);
  const searchText = new Signal("");
  const searchWords = computed(() => splitSearchWords(searchText.value));
  const isSearching = computed(() => searchWords.value.length > 0);
  const isRowMatched = (title: string, favoritesKeyBindingsRow: FavoritesKeyBindingsRow): boolean => containsEverySearchWord(
    [title, favoritesKeyBindingsRow.label, ...favoritesKeyBindingsRow.keys.value.map(formatKeyLabel)].join("\n"),
    searchWords.value
  );
  const isSectionMatched = (favoritesKeyBindingsSection: FavoritesKeyBindingsSection): boolean => (
    favoritesKeyBindingsSection.rows.some(favoritesKeyBindingsRow => isRowMatched(favoritesKeyBindingsSection.title, favoritesKeyBindingsRow))
  );
  const isSectionShown = (favoritesKeyBindingsSection: FavoritesKeyBindingsSection): boolean => {
    if (isSearching.value) {
      return isSectionMatched(favoritesKeyBindingsSection);
    }
    return selectedSectionTitle.value === favoritesKeyBindingsSection.title;
  };
  const panel = (
    <div>
      <KeyBindingList>
        {favoritesKeyBindingsSections.map(favoritesKeyBindingsSection => (
          <div hidden={computed(() => !isSectionShown(favoritesKeyBindingsSection))}>
            <div hidden={computed(() => !isSearching.value)}>
              <KeyBindingListHeading title={favoritesKeyBindingsSection.title} />
            </div>
            <KeyBindingListSection>
              {favoritesKeyBindingsSection.rows.map(favoritesKeyBindingsRow => (
                <div hidden={computed(() => isSearching.value && !isRowMatched(favoritesKeyBindingsSection.title, favoritesKeyBindingsRow))}>
                  <KeyBindingListItem
                    label={favoritesKeyBindingsRow.label}
                    keys={favoritesKeyBindingsRow.keys}
                    maxKeyCount={3}
                    formatKey={formatKeyLabel}
                    findKeyOwnerLabel={favoritesKeyBindingsRow.findKeyOwnerLabel}
                    onKeyChange={favoritesKeyBindingsRow.onKeyChange}
                    onKeyRemove={favoritesKeyBindingsRow.onKeyRemove}
                  />
                </div>
              ))}
            </KeyBindingListSection>
          </div>
        ))}
      </KeyBindingList>
      <div hidden={computed(() => !isSearching.value || favoritesKeyBindingsSections.some(isSectionMatched))}>
        <EmptyState message={computed(() => `No keyboard shortcuts match "${searchText.value.trim()}"`)} />
      </div>
    </div>
  );
  return (
    <ViewPane
      title={FAVORITES_TOOL_DEFINITIONS.keyBindings.label}
      actions={[{ label: "Reset Keyboard Shortcuts", icon: "reset", onClick: resetKeyBindings }]}
      searchChild={
        <SearchField
          label="Search Keyboard Shortcuts"
          value={searchText}
          onValueChange={value => {
            searchText.value = value;
          }}
        />
      }
      subheaderChild={
        <div hidden={isSearching}>
          <TabList
            label="Keyboard Shortcut Groups"
            controlChoices={favoritesKeyBindingsSections.map(({ title }) => ({ value: title, label: title }))}
            value={selectedSectionTitle}
            panel={panel}
            onValueChange={title => {
              searchText.value = "";
              selectedSectionTitle.value = title;
            }}
          />
        </div>
      }
    >
      {panel}
    </ViewPane>
  );
}
