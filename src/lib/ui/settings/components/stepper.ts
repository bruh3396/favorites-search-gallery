import { DebouncedStateBinding } from "@/lib/ui/settings/debounced_state_binding";
import { StepperSetting } from "@/lib/ui/settings/setting";
import { bindEnableRule } from "../enable_rule";
import { buildStepper } from "@/lib/ui/settings/components/stepper_control";
import { clamp } from "@/utils/number";
import { controlRow } from "@/lib/ui/settings/components/row";

const COMMIT_DEBOUNCE_MS = 50;

export function buildStepperRow(config: Partial<StepperSetting>): HTMLElement {
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const step = config.step ?? 1;

  const stepper = buildStepper({
    id: config.id,
    min,
    max,
    step,
    value: clamp(config.preference?.value ?? min, min, max),
    onChange: (value) => {
      binding.set(value);
    }
  });

  const binding = new DebouncedStateBinding(config, min, (value) => {
    stepper.setValue(value);
  }, COMMIT_DEBOUNCE_MS);

  const row = controlRow(config, stepper.element);

  if (config.id !== undefined) {
    row.id = `${config.id}-row`;
  }
  bindEnableRule(row, config.enabledWhen);
  return row;
}
