import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { Story } from "@/targets/kit/story";
import { createDropdown } from "@/core/ui/components/dropdown/dropdown";
import { createSegmented } from "@/core/ui/components/segmented/segmented";
import { createSettingRow } from "@/core/ui/components/setting_row/setting_row";
import { createStepper } from "@/core/ui/components/stepper/stepper";
import { createSwitch } from "@/core/ui/components/switch/switch";

const SCHEDULER = new BrowserScheduler();

const LAYOUTS = [
  { value: "column", label: "Column" },
  { value: "row", label: "Row" },
  { value: "square", label: "Square" }
] as const;

const SORTS = [
  { value: "score", label: "Score" },
  { value: "date", label: "Date uploaded" },
  { value: "random", label: "Random" }
] as const;

type Log = (message: string) => void;

function renderSwitchRow(ownerDocument: Document, log: Log): HTMLElement {
  const control = createSwitch(ownerDocument, {
    onValueChange: next => {
      log(`Autoplay → ${next}`);
      control.setValue(next);
    }
  });

  control.setValue(true);
  return createSettingRow(ownerDocument, { label: "Autoplay", control: control.element }).element;
}

function renderSegmentedRow(ownerDocument: Document, log: Log): HTMLElement {
  const control = createSegmented<string>(ownerDocument, {
    options: LAYOUTS,
    size: "small",
    onValueChange: next => {
      log(`Layout → ${next}`);
      control.setValue(next);
    }
  });

  control.setValue("column");
  return createSettingRow(ownerDocument, { label: "Layout", description: "How thumbnails are arranged.", control: control.element }).element;
}

function renderDropdownRow(ownerDocument: Document, log: Log): HTMLElement {
  const control = createDropdown<string>(ownerDocument, {
    options: SORTS,
    size: "small",
    onValueChange: next => {
      log(`Sort by → ${next}`);
      control.setValue(next);
    }
  });

  control.setValue("score");
  return createSettingRow(ownerDocument, {
    label: "Sort by",
    description: "A long caption, to show it wrapping under the label while the control keeps its size on the right.",
    control: control.element
  }).element;
}

// The second row is enabled only while the first is off, the way enabledWhen will drive it.
function renderDependentRows(ownerDocument: Document, log: Log): HTMLElement {
  const group = ownerDocument.createElement("div");
  const results = createStepper(ownerDocument, {
    label: "Results per page",
    min: 10,
    max: 200,
    step: 10,
    size: "small",
    scheduler: SCHEDULER,
    onValueChange: next => {
      log(`Results per page → ${next}`);
      results.setValue(next);
    }
  });
  const infinite = createSwitch(ownerDocument, {
    onValueChange: next => {
      log(`Infinite scroll → ${next}`);
      infinite.setValue(next);
      results.setDisabled(next);
    }
  });

  infinite.setValue(false);
  results.setValue(50);
  group.append(
    createSettingRow(ownerDocument, { label: "Infinite scroll", control: infinite.element }).element,
    createSettingRow(ownerDocument, { label: "Results per page", description: "Disabled while infinite scroll is on.", control: results.element }).element
  );
  return group;
}

export const SETTING_ROW_STORY: Story = {
  title: "Setting row",
  variants: [
    { label: "Switch, no description", render: renderSwitchRow },
    { label: "Segmented", render: renderSegmentedRow },
    { label: "Dropdown, long caption", render: renderDropdownRow },
    { label: "Enabled by another setting", render: renderDependentRows }
  ]
};
