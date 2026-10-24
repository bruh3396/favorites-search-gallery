import { ChoiceSetting, ChoicesSetting, NumberSetting, SettingDescriptor, SliderSetting, SwitchSetting } from "@/core/ui/settings/descriptor";
import { ControlChoice, ControlSize } from "@/core/ui/components/control";
import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Stepper, StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { Dropdown } from "@/core/ui/components/dropdown/dropdown";
import { MultiSelect } from "@/core/ui/components/multi_select/multi_select";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { SettingRow } from "@/core/ui/components/setting_row/setting_row";
import { Slider } from "@/core/ui/components/slider/slider";
import { Switch } from "@/core/ui/components/switch/switch";
import { assertNever } from "@/core/utils/guards/guards";
import { h } from "@/core/ui/h/h";

export interface SettingProps {
  descriptor: SettingDescriptor;
  descriptionVisible?: Readable<boolean>;
  size?: ControlSize;
  scheduler: StepperScheduler;
}

interface SettingControlProps<D extends SettingDescriptor = SettingDescriptor> {
  descriptor: D;
  size: ControlSize;
  scheduler: StepperScheduler;
}

export function Setting({ descriptor, descriptionVisible, size = "medium", scheduler }: SettingProps): HTMLElement {
  const control = <SettingControl descriptor={descriptor} size={size} scheduler={scheduler} />;
  return (
    <SettingRow
      label={descriptor.label}
      description={descriptor.description}
      descriptionVisible={descriptionVisible}
      control={control}
      size={size}
      onActivate={createActivation(control)}
    />
  );
}

function createActivation(control: HTMLElement): (() => void) | undefined {
  if (control instanceof HTMLSelectElement) {
    return () => {
      if (!control.disabled) {
        control.showPicker();
      }
    };
  }
  return control.role === "switch" ? (): void => control.click() : undefined;
}

function SettingControl({ descriptor, size, scheduler }: SettingControlProps): HTMLElement {
  switch (descriptor.kind) {
    case "switch":
      return <SwitchControl descriptor={descriptor} size={size} scheduler={scheduler} />;
    case "choice":
      return <ChoiceControl descriptor={descriptor} size={size} scheduler={scheduler} />;
    case "choices":
      return <ChoicesControl descriptor={descriptor} size={size} scheduler={scheduler} />;
    case "number":
      return <NumberControl descriptor={descriptor} size={size} scheduler={scheduler} />;
    case "slider":
      return <SliderControl descriptor={descriptor} size={size} scheduler={scheduler} />;
    default:
      return assertNever(descriptor);
  }
}

function SwitchControl({ descriptor: { preference, disabled }, size }: SettingControlProps<SwitchSetting>): HTMLElement {
  return <Switch value={preference} disabled={disabled} size={size} onValueChange={next => preference.set(next)} />;
}

function ChoiceControl({ descriptor, size }: SettingControlProps<ChoiceSetting>): HTMLElement {
  const { preference, disabled, control } = descriptor;
  const props = { choices: createChoices(descriptor), value: preference, disabled, size, onValueChange: (next: string): void => preference.set(next) };
  return control === "segmented" ? <Segmented<string> {...props} /> : <Dropdown<string> {...props} />;
}

function ChoicesControl({ descriptor, size }: SettingControlProps<ChoicesSetting>): HTMLElement {
  const { preference, disabled } = descriptor;
  return (
    <MultiSelect<string>
      choices={createChoices(descriptor)}
      value={preference}
      disabled={disabled}
      size={size}
      onValueChange={next => preference.set(next)}
    />
  );
}

function NumberControl({
  descriptor: { preference, disabled, label, min, max, step, writeOnEveryStep = false },
  size,
  scheduler
}: SettingControlProps<NumberSetting>): HTMLElement {
  const draft = new Signal(preference.peek());
  const write = (next: number): void => preference.set(next);
  const preview = (next: number): void => {
    draft.value = next;
  };

  effect(() => {
    draft.value = preference.value;
  });
  return (
    <Stepper
      label={label}
      min={min}
      max={max}
      step={step}
      size={size}
      scheduler={scheduler}
      disabled={disabled}
      value={draft}
      onValueChange={writeOnEveryStep ? write : preview}
      onValueCommit={writeOnEveryStep ? undefined : write}
    />
  );
}

function SliderControl({
  descriptor: { preference, disabled, label, min, max, step, inverted = false },
  size
}: SettingControlProps<SliderSetting>): HTMLElement {
  const toPosition = (value: number): number => (inverted ? min + max - value : value);
  return (
    <Slider
      label={label}
      min={min}
      max={max}
      step={step}
      size={size}
      disabled={disabled}
      value={computed(() => toPosition(preference.value))}
      onValueChange={next => preference.set(toPosition(next))}
    />
  );
}

function createChoices(descriptor: ChoiceSetting | ChoicesSetting): ControlChoice<string>[] {
  const { members, labels } = descriptor;
  const icons = descriptor.kind === "choice" ? descriptor.icons : undefined;
  return members.map(member => ({ value: member, label: labels[member], icon: icons?.[member] }));
}
