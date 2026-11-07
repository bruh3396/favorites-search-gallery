import { Child, h } from "@/core/ui/h/h";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { IconButton } from "@/core/ui/components/icon_button/icon_button";

export const FavoritesSearchSettingsRowClass = {
  root: "fsg-FavoritesSearchSettingsRow",
  reset: "fsg-FavoritesSearchSettingsRow-reset"
} as const;

export interface FavoritesSearchSettingsRowProps {
  changedSearchSettingCount: Readable<number>;
  resetSearchSettings: () => void;
  children: Child;
}

export function FavoritesSearchSettingsRow({ changedSearchSettingCount, resetSearchSettings, children }: FavoritesSearchSettingsRowProps): HTMLElement {
  return (
    <div className={FavoritesSearchSettingsRowClass.root} role="group" aria-label="Filters">
      {children}
      <IconButton
        className={FavoritesSearchSettingsRowClass.reset}
        icon="reset"
        label="Reset Filters"
        size="small"
        disabled={computed(() => changedSearchSettingCount.value === 0)}
        onClick={resetSearchSettings}
      />
    </div>
  );
}
