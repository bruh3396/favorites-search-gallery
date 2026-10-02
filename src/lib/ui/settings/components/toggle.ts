import { SwitchOptions, createSwitch } from "@/lib/ui/settings/components/switch";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { controlRow } from "@/lib/ui/settings/components/row";
import { toggleDataset } from "@/utils/browser/dataset";

export interface ToggleRow {
  element: HTMLElement;
  setChecked: (checked: boolean) => void;
  setDisabled: (disabled: boolean) => void;
}

export function buildToggleRow(config: Partial<ToggleSetting>, options: SwitchOptions): ToggleRow {
  const control = createSwitch(document, options);
  const row = controlRow(config, control.element, "label");

  if (config.id !== undefined) {
    row.id = `${config.id}-row`;
  }
  return {
    element: row,
    setChecked: control.setChecked,
    setDisabled: (disabled): void => {
      toggleDataset(row, "disabled", disabled);
      control.setDisabled(disabled);
    }
  };
}
