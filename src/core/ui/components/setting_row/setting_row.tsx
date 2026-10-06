import { Readable, computed } from "@/core/utils/reactive/signal";
import { ControlSize } from "@/core/ui/components/control";
import { h } from "@/core/ui/h/h";

export const SettingRowClass = {
  root: "fsg-SettingRow",
  text: "fsg-SettingRow-text",
  label: "fsg-SettingRow-label",
  description: "fsg-SettingRow-description"
} as const;

export interface SettingRowProps {
  label: string;
  description?: string;
  descriptionVisible?: Readable<boolean>;
  control: HTMLElement;
  size?: ControlSize;
}

// One setting: its label and caption beside one control (libadwaita ActionRow, Primer FormControl).
// The text names and describes the control by element reference, so no ids are needed.
export function SettingRow({ label, description, descriptionVisible, control, size = "medium" }: SettingRowProps): HTMLElement {
  const labelElement = <span className={SettingRowClass.label}>{label}</span>;
  const descriptionElement = description === undefined
    ? undefined
    : <span className={SettingRowClass.description} hidden={computed(() => descriptionVisible?.value === false)}>{description}</span>;

  control.ariaLabelledByElements = [labelElement];

  if (descriptionElement !== undefined) {
    control.ariaDescribedByElements = [descriptionElement];
  }
  return (
    <div className={SettingRowClass.root} dataset={{ size }}>
      <div className={SettingRowClass.text}>
        {labelElement}
        {descriptionElement}
      </div>
      {control}
    </div>
  );
}
