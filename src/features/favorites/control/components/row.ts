import { FavoritesConfig } from "@/config/favorites_config";
import { SettingsClass } from "@/features/favorites/types/scaffold";

export function controlRow(label: string, title: string, control: HTMLElement, enabled: boolean): HTMLElement {
  const row = document.createElement("div");

  row.className = SettingsClass.row;

  if (title !== "" && FavoritesConfig.settingsTooltipHintEnabled) {
    row.dataset.tooltip = title;
  }
  const text = document.createElement("span");

  text.className = SettingsClass.rowLabel;
  text.textContent = label;

  control.classList.add(SettingsClass.control);
  row.append(text, control);

  if (!enabled) {
    row.dataset.disabled = "";
  }
  return row;
}
