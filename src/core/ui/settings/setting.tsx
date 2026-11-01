import { ChoiceSettingDescriptor, ChoicesSettingDescriptor, NumberSettingDescriptor, SettingDescriptor, SliderSettingDescriptor, SwitchSettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { Signal, computed, effect } from "@/core/utils/reactive/signal";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { ControlSize } from "@/core/ui/components/control/control_size";
import { Dropdown } from "@/core/ui/components/dropdown/dropdown";
import { MultiSelect } from "@/core/ui/components/multi_select/multi_select";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { SettingRow } from "@/core/ui/components/setting_row/setting_row";
import { Slider } from "@/core/ui/components/slider/slider";
import { Stepper } from "@/core/ui/components/stepper/stepper";
import { Switch } from "@/core/ui/components/switch/switch";
import { UnreachableError } from "@/core/utils/error/unreachable_error";
import { h } from "@/core/ui/h/h";

export interface SettingProps {
  descriptor: SettingDescriptor;
  controlSize?: ControlSize;
}

interface SettingControlProps<D extends SettingDescriptor = SettingDescriptor> {
  descriptor: D;
  controlSize: ControlSize;
}

export function Setting({ descriptor: settingDescriptor, controlSize = "medium" }: SettingProps): HTMLElement {
  const control = <SettingControl descriptor={settingDescriptor} controlSize={controlSize} />;
  return (
    <SettingRow
      label={settingDescriptor.label}
      control={control}
      controlSize={controlSize}
      onActivate={createActivation(control)}
    />
  );
}

function createActivation(control: HTMLElement): (() => void) | undefined {
  return control.role === "switch" || control.role === "combobox" ? (): void => control.click() : undefined;
}

function SettingControl({ descriptor: settingDescriptor, controlSize }: SettingControlProps): HTMLElement {
  switch (settingDescriptor.kind) {
    case "switch":
      return <SwitchControl descriptor={settingDescriptor} controlSize={controlSize} />;
    case "choice":
      return <ChoiceControl descriptor={settingDescriptor} controlSize={controlSize} />;
    case "choices":
      return <ChoicesControl descriptor={settingDescriptor} controlSize={controlSize} />;
    case "number":
      return <NumberControl descriptor={settingDescriptor} controlSize={controlSize} />;
    case "slider":
      return <SliderControl descriptor={settingDescriptor} controlSize={controlSize} />;
    default:
      throw new UnreachableError(settingDescriptor);
  }
}

function SwitchControl({ descriptor: { settingPreference, disabled }, controlSize }: SettingControlProps<SwitchSettingDescriptor>): HTMLElement {
  return <Switch value={settingPreference} disabled={disabled} size={controlSize} onValueChange={next => settingPreference.set(next)} />;
}

function ChoiceControl({ descriptor: choiceSettingDescriptor, controlSize }: SettingControlProps<ChoiceSettingDescriptor>): HTMLElement {
  const { settingPreference, disabled, control, onPreview } = choiceSettingDescriptor;
  const props = {
    controlChoices: createChoices(choiceSettingDescriptor),
    value: settingPreference,
    disabled,
    size: controlSize,
    onValueChange: (next: string): void => settingPreference.set(next)
  };
  return control === "segmented" ? <Segmented<string> {...props} /> : <Dropdown<string> {...props} onPreview={onPreview} />;
}

function ChoicesControl({ descriptor: choicesSettingDescriptor, controlSize }: SettingControlProps<ChoicesSettingDescriptor>): HTMLElement {
  const { settingPreference, disabled } = choicesSettingDescriptor;
  return (
    <MultiSelect<string>
      controlChoices={createChoices(choicesSettingDescriptor)}
      value={settingPreference}
      disabled={disabled}
      size={controlSize}
      onValueChange={next => settingPreference.set(next)}
    />
  );
}

function NumberControl({
  descriptor: { settingPreference, disabled, label, min, max, step, writeOnEveryStep = false, stepperScheduler },
  controlSize
}: SettingControlProps<NumberSettingDescriptor>): HTMLElement {
  const draft = new Signal(settingPreference.peek());
  const write = (next: number): void => settingPreference.set(next);
  const preview = (next: number): void => {
    draft.value = next;
  };

  effect(() => {
    draft.value = settingPreference.value;
  });
  return (
    <Stepper
      label={label}
      min={min}
      max={max}
      step={step}
      size={controlSize}
      scheduler={stepperScheduler}
      disabled={disabled}
      value={draft}
      onValueChange={writeOnEveryStep ? write : preview}
      onValueCommit={writeOnEveryStep ? undefined : write}
    />
  );
}

function SliderControl({
  descriptor: { settingPreference, disabled, label, min, max, step, inverted = false },
  controlSize
}: SettingControlProps<SliderSettingDescriptor>): HTMLElement {
  const toPosition = (value: number): number => (inverted ? min + max - value : value);
  return (
    <Slider
      label={label}
      min={min}
      max={max}
      step={step}
      size={controlSize}
      disabled={disabled}
      value={computed(() => toPosition(settingPreference.value))}
      onValueChange={next => settingPreference.set(toPosition(next))}
    />
  );
}

function createChoices(descriptor: ChoiceSettingDescriptor | ChoicesSettingDescriptor): ControlChoice<string>[] {
  const { members, labels } = descriptor;
  const icons = descriptor.kind === "choice" ? descriptor.icons : undefined;
  return members.map(member => ({ value: member, label: labels[member], icon: icons?.[member] }));
}
