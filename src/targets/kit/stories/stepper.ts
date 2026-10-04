import { StepperSize, createStepper } from "@/core/ui/components/stepper/stepper";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { Story } from "@/targets/kit/story";

interface StepperState {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: StepperSize;
}

const SCHEDULER = new BrowserScheduler();

// Each variant closes the controlled loop itself: whatever the stepper reports is told straight back to it.
function variant(label: string, { value, min = 0, max = 100, step, disabled = false, size }: StepperState): Story["variants"][number] {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const control = createStepper(ownerDocument, {
        label,
        min,
        max,
        step,
        size,
        scheduler: SCHEDULER,
        onValueChange: next => {
          log(`Stepper "${label}" → ${next}`);
          control.setValue(next);
        }
      });

      control.setValue(value);
      control.setDisabled(disabled);
      return control.element;
    }
  };
}

export const STEPPER_STORY: Story = {
  title: "Stepper",
  variants: [
    variant("0–100", { value: 25 }),
    variant("Step 5, off grid", { value: 12, step: 5 }),
    variant("Step 0.1, 0–1", { value: 0.5, max: 1, step: 0.1 }),
    variant("At the max", { value: 10, max: 10 }),
    variant("Small", { value: 3, size: "small" }),
    variant("Disabled", { value: 40, disabled: true })
  ]
};
