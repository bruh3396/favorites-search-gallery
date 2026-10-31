import { Readable, computed } from "@/core/utils/reactive/signal";
import { ControlSize } from "@/core/ui/components/control/control_size";
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
  controlSize?: ControlSize;
  onActivate?: () => void;
}

export function SettingRow({ label, description, descriptionVisible, control, controlSize = "medium", onActivate }: SettingRowProps): HTMLElement {
  const labelElement = <span className={SettingRowClass.label}>{label}</span>;
  const hidden = computed(() => descriptionVisible?.value === false);
  const descriptionElement = description === undefined ? undefined : <span className={SettingRowClass.description} hidden={hidden}>{description}</span>;

  control.ariaLabelledByElements = [labelElement];

  if (descriptionElement !== undefined) {
    control.ariaDescribedByElements = [descriptionElement];
  }
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
      <div className={SettingRowClass.text}>
        {labelElement}
        {descriptionElement}
      </div>
      {control}
    </div>
  );
}
