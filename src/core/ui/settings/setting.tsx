import { ChoiceSetting, ChoicesSetting, NumberSetting, SettingDescriptor, SwitchSetting } from "@/core/ui/settings/descriptor";
import { ControlChoice, ControlSize } from "@/core/ui/components/control";
import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { Stepper, StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { Dropdown } from "@/core/ui/components/dropdown/dropdown";
import { MultiSelect } from "@/core/ui/components/multi_select/multi_select";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { SettingRow } from "@/core/ui/components/setting_row/setting_row";
import { Switch } from "@/core/ui/components/switch/switch";
import { assertNever } from "@/core/utils/guards/guards";
import { h } from "@/core/ui/h/h";

export interface SettingProps {
  descriptor: SettingDescriptor;
  descriptionVisible?: Readable<boolean>;
  size?: ControlSize;
  scheduler: StepperScheduler;
}

// What every control a setting builds is given, whatever its kind.
interface SettingControlProps<D extends SettingDescriptor = SettingDescriptor> {
  descriptor: D;
  size: ControlSize;
  scheduler: StepperScheduler;
}

export function Setting({ descriptor, descriptionVisible, size = "medium", scheduler }: SettingProps): HTMLElement {
  return (
    <SettingRow
      label={descriptor.label}
      description={descriptor.description}
      descriptionVisible={descriptionVisible}
      control={<SettingControl descriptor={descriptor} size={size} scheduler={scheduler} />}
      size={size}
    />
  );
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

// A number that doesn't write on every step previews each step in a draft and writes the preference once, when the gesture ends.
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

function createChoices({ members, labels }: ChoiceSetting | ChoicesSetting): ControlChoice<string>[] {
  return members.map(member => ({ value: member, label: labels[member] }));
}
