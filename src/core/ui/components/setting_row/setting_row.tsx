import { ControlSize } from "@/core/ui/components/control/control_size";
import { h } from "@/core/ui/h/h";

export const SettingRowClass = {
  root: "fsg-SettingRow",
  label: "fsg-SettingRow-label"
} as const;

export interface SettingRowProps {
  label: string;
  control: HTMLElement;
  controlSize?: ControlSize;
  onActivate?: () => void;
}

export function SettingRow({ label, control, controlSize = "medium", onActivate }: SettingRowProps): HTMLElement {
  const labelElement = <span className={SettingRowClass.label}>{label}</span>;

  control.ariaLabelledByElements = [labelElement];
  return (
    <div
      className={SettingRowClass.root}
      dataset={onActivate === undefined ? { size: controlSize } : { size: controlSize, activatable: "" }}
      onClick={event => {
        if (onActivate !== undefined && !control.contains(event.target as Node)) {
          onActivate();
        }
      }}
    >
      {labelElement}
      {control}
    </div>
  );
}
