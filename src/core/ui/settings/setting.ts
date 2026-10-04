import { ChoiceSetting, ChoicesSetting, NumberSetting, SettingDescriptor, SettingPreference, SwitchSetting } from "@/core/ui/settings/descriptor";
import { StepperScheduler, createStepper } from "@/core/ui/components/stepper/stepper";
import { Control } from "@/core/ui/control";
import { assertNever } from "@/core/utils/guards/guards";
import { createDropdown } from "@/core/ui/components/dropdown/dropdown";
import { createMultiSelect } from "@/core/ui/components/multi_select/multi_select";
import { createSegmented } from "@/core/ui/components/segmented/segmented";
import { createSettingRow } from "@/core/ui/components/setting_row/setting_row";
import { createSwitch } from "@/core/ui/components/switch/switch";
import { effect } from "@/core/utils/reactive/signal";

export type SettingSize = "medium" | "small";

export interface SettingOptions {
  descriptor: SettingDescriptor;
  size?: SettingSize;
  scheduler: StepperScheduler;
}

export interface Setting {
  readonly element: HTMLDivElement;
  setDescriptionVisible: (visible: boolean) => void;
  dispose: () => void;
}

interface BoundControl {
  readonly element: HTMLElement;
  showValue: () => void;
  setDisabled: (disabled: boolean) => void;
}

interface Appearance {
  size: SettingSize;
  scheduler: StepperScheduler;
}

export function createSetting(ownerDocument: Document, { descriptor, size = "medium", scheduler }: SettingOptions): Setting {
  const control = createControl(ownerDocument, descriptor, { size, scheduler });
  const { element, setDescriptionVisible } = createSettingRow(ownerDocument, {
    label: descriptor.label, description: descriptor.description, control: control.element, size
  });
  const { enabledWhen } = descriptor;
  const disposers = [effect(control.showValue)];

  if (enabledWhen !== undefined) {
    disposers.push(effect(() => control.setDisabled(!enabledWhen())));
  }
  return {
    element,
    setDescriptionVisible,
    dispose: (): void => disposers.forEach((dispose) => dispose())
  };
}

function createControl(ownerDocument: Document, descriptor: SettingDescriptor, appearance: Appearance): BoundControl {
  switch (descriptor.kind) {
    case "switch":
      return createSwitchControl(ownerDocument, descriptor, appearance);
    case "choice":
      return createChoiceControl(ownerDocument, descriptor, appearance);
    case "choices":
      return createChoicesControl(ownerDocument, descriptor, appearance);
    case "number":
      return createNumberControl(ownerDocument, descriptor, appearance);
    default:
      return assertNever(descriptor);
  }
}

function createSwitchControl(ownerDocument: Document, { preference }: SwitchSetting, { size }: Appearance): BoundControl {
  return bind(createSwitch(ownerDocument, { size, onValueChange: (next) => preference.set(next) }), preference);
}

function createChoiceControl(ownerDocument: Document, descriptor: ChoiceSetting, { size }: Appearance): BoundControl {
  const { preference, variant } = descriptor;
  const options = { options: optionsOf(descriptor), size, onValueChange: (next: string): void => preference.set(next) };
  const control = variant === "segmented" ? createSegmented(ownerDocument, options) : createDropdown(ownerDocument, options);
  return bind(control, preference);
}

function createChoicesControl(ownerDocument: Document, descriptor: ChoicesSetting, { size }: Appearance): BoundControl {
  const { preference } = descriptor;
  return bind(createMultiSelect(ownerDocument, { options: optionsOf(descriptor), size, onValueChange: (next) => preference.set(next) }), preference);
}

function createNumberControl(
  ownerDocument: Document,
  { preference, label, min, max, step, live = false }: NumberSetting,
  { size, scheduler }: Appearance
): BoundControl {
  const write = (next: number): void => preference.set(next);
  const preview = (next: number): void => stepper.setValue(next);
  const stepper = createStepper(ownerDocument, {
    label, min, max, step, size, scheduler,
    onValueChange: live ? write : preview,
    onValueCommit: live ? undefined : write
  });
  return bind(stepper, preference);
}

function bind<T>(control: Control<T>, preference: SettingPreference<T>): BoundControl {
  return {
    element: control.element,
    showValue: (): void => control.setValue(preference.value),
    setDisabled: control.setDisabled
  };
}

function optionsOf({ members, labels }: ChoiceSetting | ChoicesSetting): { value: string; label: string }[] {
  return members.map((member) => ({ value: member, label: labels[member] }));
}
