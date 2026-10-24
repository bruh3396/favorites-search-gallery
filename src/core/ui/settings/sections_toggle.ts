import { SettingPreference } from "@/core/ui/settings/descriptor";
import { SettingsLayout } from "@/core/ui/settings/screen";
import { ViewPaneAction } from "@/core/ui/components/view_pane/view_pane";
import { computed } from "@/core/utils/reactive/signal";

export function createSectionsToggleAction(layout: SettingsLayout, expanded: SettingPreference<readonly string[]>): ViewPaneAction {
  const allCollapsed = computed(() => !layout.some(section => expanded.value.includes(section.id)));
  return {
    label: computed(() => (allCollapsed.value ? "Expand all" : "Collapse all")),
    icon: computed(() => (allCollapsed.value ? "expandAll" : "collapseAll")),
    onClick: () => expanded.set(allCollapsed.peek() ? layout.map(section => section.id) : [])
  };
}
