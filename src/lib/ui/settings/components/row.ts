import { Setting } from "@/lib/ui/settings/setting";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { buildDataset } from "@/utils/dom/attribute";
import { createElement } from "@/utils/dom/element_factory";

export function controlRow<T>(config: Partial<Setting<T>>, control: HTMLElement): HTMLElement {
  control.classList.add(SettingsClass.control);
  const dataset = buildDataset({
    tooltip: config.tooltip === undefined || config.tooltip === "" ? undefined : config.tooltip,
    disabled: config.enabled === false ? "" : undefined
  });
  const text = createElement("span", { className: SettingsClass.rowLabel, textContent: config.label ?? "" });
  return createElement("div", { className: SettingsClass.row, dataset, children: [text, control] });
}
