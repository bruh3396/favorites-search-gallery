import { ChoiceSetting, ChoicesSetting, NumberSetting, SettingDescriptor, SliderSetting, SwitchSetting } from "@/core/ui/settings/setting_descriptor";
import { ControlChoice } from "@/core/ui/components/control/control_choice";
import { ControlSize } from "@/core/ui/components/control/control_size";
import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Stepper, StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { Dropdown } from "@/core/ui/components/dropdown/dropdown";
import { MultiSelect } from "@/core/ui/components/multi_select/multi_select";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { SettingRow } from "@/core/ui/components/setting_row/setting_row";
import { Slider } from "@/core/ui/components/slider/slider";
import { Switch } from "@/core/ui/components/switch/switch";
import { UnreachableError } from "@/core/utils/error/unreachable_error";
import { h } from "@/core/ui/h/h";

export interface SettingProps {
  descriptor: SettingDescriptor;
  descriptionVisible?: Readable<boolean>;
  controlSize?: ControlSize;
  stepperScheduler: StepperScheduler;
}

interface SettingControlProps<D extends SettingDescriptor = SettingDescriptor> {
  descriptor: D;
  controlSize: ControlSize;
  stepperScheduler: StepperScheduler;
}

export function Setting({ descriptor: settingDescriptor, descriptionVisible, controlSize = "medium", stepperScheduler }: SettingProps): HTMLElement {
  const control = <SettingControl descriptor={settingDescriptor} controlSize={controlSize} stepperScheduler={stepperScheduler} />;
  return (
    <SettingRow
      label={settingDescriptor.label}
      description={settingDescriptor.description}
      descriptionVisible={descriptionVisible}
      control={control}
      controlSize={controlSize}
      onActivate={createActivation(control)}
    />
  );
}

function createActivation(control: HTMLElement): (() => void) | undefined {
  return control.role === "switch" || control.role === "combobox" ? (): void => control.click() : undefined;
}

function SettingControl({ descriptor: settingDescriptor, controlSize, stepperScheduler }: SettingControlProps): HTMLElement {
  switch (settingDescriptor.kind) {
    case "switch":
      return <SwitchControl descriptor={settingDescriptor} controlSize={controlSize} stepperScheduler={stepperScheduler} />;
    case "choice":
      return <ChoiceControl descriptor={settingDescriptor} controlSize={controlSize} stepperScheduler={stepperScheduler} />;
    case "choices":
      return <ChoicesControl descriptor={settingDescriptor} controlSize={controlSize} stepperScheduler={stepperScheduler} />;
    case "number":
      return <NumberControl descriptor={settingDescriptor} controlSize={controlSize} stepperScheduler={stepperScheduler} />;
    case "slider":
      return <SliderControl descriptor={settingDescriptor} controlSize={controlSize} stepperScheduler={stepperScheduler} />;
    default:
      throw new UnreachableError(settingDescriptor);
  }
}

function SwitchControl({ descriptor: { settingPreference, disabled }, controlSize }: SettingControlProps<SwitchSetting>): HTMLElement {
  return <Switch value={settingPreference} disabled={disabled} size={controlSize} onValueChange={next => settingPreference.set(next)} />;
}

function ChoiceControl({ descriptor: choiceSetting, controlSize }: SettingControlProps<ChoiceSetting>): HTMLElement {
  const { settingPreference, disabled, control, onPreview } = choiceSetting;
  const props = { controlChoices: createChoices(choiceSetting), value: settingPreference, disabled, size: controlSize, onValueChange: (next: string): void => settingPreference.set(next) };
  return control === "segmented" ? <Segmented<string> {...props} /> : <Dropdown<string> {...props} onPreview={onPreview} />;
}

function ChoicesControl({ descriptor: choicesSetting, controlSize }: SettingControlProps<ChoicesSetting>): HTMLElement {
  const { settingPreference, disabled } = choicesSetting;
  return (
    <MultiSelect<string>
      controlChoices={createChoices(choicesSetting)}
      value={settingPreference}
      disabled={disabled}
      size={controlSize}
      onValueChange={next => settingPreference.set(next)}
    />
  );
}

function NumberControl({
  descriptor: { settingPreference, disabled, label, min, max, step, writeOnEveryStep = false },
  controlSize,
  stepperScheduler
}: SettingControlProps<NumberSetting>): HTMLElement {
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
}: SettingControlProps<SliderSetting>): HTMLElement {
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

function createChoices(descriptor: ChoiceSetting | ChoicesSetting): ControlChoice<string>[] {
  const { members, labels } = descriptor;
  const icons = descriptor.kind === "choice" ? descriptor.icons : undefined;
  return members.map(member => ({ value: member, label: labels[member], icon: icons?.[member] }));
}
