import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";
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
  const autoplay = new Signal(true);
  const control = createSwitch(ownerDocument, {
    value: autoplay,
    onValueChange: next => {
      log(`Autoplay → ${next}`);
      autoplay.value = next;
    }
  });
  return createSettingRow(ownerDocument, { label: "Autoplay", control: control.element }).element;
}

function renderSegmentedRow(ownerDocument: Document, log: Log): HTMLElement {
  const layout = new Signal<string>("column");
  const control = createSegmented<string>(ownerDocument, {
    choices: LAYOUTS,
    size: "small",
    value: layout,
    onValueChange: next => {
      log(`Layout → ${next}`);
      layout.value = next;
    }
  });
  return createSettingRow(ownerDocument, { label: "Layout", description: "How thumbnails are arranged.", control: control.element }).element;
}

function renderDropdownRow(ownerDocument: Document, log: Log): HTMLElement {
  const sort = new Signal<string>("score");
  const control = createDropdown<string>(ownerDocument, {
    choices: SORTS,
    size: "small",
    value: sort,
    onValueChange: next => {
      log(`Sort by → ${next}`);
      sort.value = next;
    }
  });
  return createSettingRow(ownerDocument, {
    label: "Sort by",
    description: "A long caption, to show it wrapping under the label while the control keeps its size on the right.",
    control: control.element
  }).element;
}

// The second row is disabled while the first is on: the switch's signal is the stepper's disabled state.
function renderDependentRows(ownerDocument: Document, log: Log): HTMLElement {
  const group = ownerDocument.createElement("div");
  const infiniteScroll = new Signal(false);
  const resultsPerPage = new Signal(50);
  const infinite = createSwitch(ownerDocument, {
    value: infiniteScroll,
    onValueChange: next => {
      log(`Infinite scroll → ${next}`);
      infiniteScroll.value = next;
    }
  });
  const results = createStepper(ownerDocument, {
    label: "Results per page",
    min: 10,
    max: 200,
    step: 10,
    size: "small",
    scheduler: SCHEDULER,
    value: resultsPerPage,
    disabled: infiniteScroll,
    onValueChange: next => {
      log(`Results per page → ${next}`);
      resultsPerPage.value = next;
    }
  });

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
    { label: "Disabled by another setting", render: renderDependentRows }
  ]
};
