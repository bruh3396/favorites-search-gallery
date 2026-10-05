import { ChoiceSetting, ChoicesSetting, NumberSetting, SettingDescriptor, SwitchSetting } from "@/core/ui/settings/descriptor";
import { Control, ControlChoice, ControlSize } from "@/core/ui/components/control";
import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { StepperScheduler, createStepper } from "@/core/ui/components/stepper/stepper";
import { assertNever } from "@/core/utils/guards/guards";
import { createDropdown } from "@/core/ui/components/dropdown/dropdown";
import { createMultiSelect } from "@/core/ui/components/multi_select/multi_select";
import { createSegmented } from "@/core/ui/components/segmented/segmented";
import { createSettingRow } from "@/core/ui/components/setting_row/setting_row";
import { createSwitch } from "@/core/ui/components/switch/switch";

export interface SettingOptions {
  descriptor: SettingDescriptor;
  descriptionVisible?: Readable<boolean>;
  size?: ControlSize;
  scheduler: StepperScheduler;
}

export interface Setting {
  readonly element: HTMLDivElement;
  dispose: () => void;
}

// What every control a setting builds is given, whatever its kind.
interface SharedControlOptions {
  size: ControlSize;
  scheduler: StepperScheduler;
}

export function createSetting(ownerDocument: Document, { descriptor, descriptionVisible, size = "medium", scheduler }: SettingOptions): Setting {
  const control = createControl(ownerDocument, descriptor, { size, scheduler });
  const row = createSettingRow(ownerDocument, {
    label: descriptor.label, description: descriptor.description, descriptionVisible, control: control.element, size
  });
  return {
    element: row.element,
    dispose: (): void => {
      control.dispose();
      row.dispose();
    }
  };
}

function createControl(ownerDocument: Document, descriptor: SettingDescriptor, shared: SharedControlOptions): Control {
  switch (descriptor.kind) {
    case "switch":
      return createSwitchControl(ownerDocument, descriptor, shared);
    case "choice":
      return createChoiceControl(ownerDocument, descriptor, shared);
    case "choices":
      return createChoicesControl(ownerDocument, descriptor, shared);
    case "number":
      return createNumberControl(ownerDocument, descriptor, shared);
    default:
      return assertNever(descriptor);
  }
}

function createSwitchControl(ownerDocument: Document, { preference, disabled }: SwitchSetting, { size }: SharedControlOptions): Control {
  return createSwitch(ownerDocument, { value: preference, disabled, size, onValueChange: next => preference.set(next) });
}

function createChoiceControl(ownerDocument: Document, descriptor: ChoiceSetting, { size }: SharedControlOptions): Control {
  const { preference, disabled, control } = descriptor;
  const options = { choices: createChoices(descriptor), value: preference, disabled, size, onValueChange: (next: string): void => preference.set(next) };
  return control === "segmented" ? createSegmented(ownerDocument, options) : createDropdown(ownerDocument, options);
}

function createChoicesControl(ownerDocument: Document, descriptor: ChoicesSetting, { size }: SharedControlOptions): Control {
  const { preference, disabled } = descriptor;
  return createMultiSelect(ownerDocument, {
    choices: createChoices(descriptor), value: preference, disabled, size, onValueChange: next => preference.set(next)
  });
}

// A number that doesn't write on every step previews each step in a draft and writes the preference once, when the gesture ends.
function createNumberControl(
  ownerDocument: Document,
  { preference, disabled, label, min, max, step, writeOnEveryStep = false }: NumberSetting,
  { size, scheduler }: SharedControlOptions
): Control {
  const draft = new Signal(preference.peek());
  const disposeDraft = effect(() => {
    draft.value = preference.value;
  });
  const write = (next: number): void => preference.set(next);
  const preview = (next: number): void => {
    draft.value = next;
  };
  const stepper = createStepper(ownerDocument, {
    label, min, max, step, size, scheduler, disabled,
    value: draft,
    onValueChange: writeOnEveryStep ? write : preview,
    onValueCommit: writeOnEveryStep ? undefined : write
  });
  return {
    element: stepper.element,
    dispose: (): void => {
      stepper.dispose();
      disposeDraft();
    }
  };
}

function createChoices({ members, labels }: ChoiceSetting | ChoicesSetting): ControlChoice<string>[] {
  return members.map(member => ({ value: member, label: labels[member] }));
}
