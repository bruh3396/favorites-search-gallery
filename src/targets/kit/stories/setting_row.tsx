import { h, render } from "@/core/ui/h/h";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { Dropdown } from "@/core/ui/components/dropdown/dropdown";
import { Segmented } from "@/core/ui/components/segmented/segmented";
import { SettingRow } from "@/core/ui/components/setting_row/setting_row";
import { Signal } from "@/core/utils/reactive/signal";
import { Stepper } from "@/core/ui/components/stepper/stepper";
import { Story } from "@/targets/kit/story";
import { Switch } from "@/core/ui/components/switch/switch";

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
  return render(ownerDocument, () => (
    <SettingRow
      label="Autoplay"
      control={
        <Switch
          value={autoplay}
          onValueChange={next => {
            log(`Autoplay → ${next}`);
            autoplay.value = next;
          }}
        />
      }
    />
  )).result;
}

function renderSegmentedRow(ownerDocument: Document, log: Log): HTMLElement {
  const layout = new Signal<string>("column");
  return render(ownerDocument, () => (
    <SettingRow
      label="Layout"
      description="How thumbnails are arranged."
      control={
        <Segmented<string>
          choices={LAYOUTS}
          size="small"
          value={layout}
          onValueChange={next => {
            log(`Layout → ${next}`);
            layout.value = next;
          }}
        />
      }
    />
  )).result;
}

function renderDropdownRow(ownerDocument: Document, log: Log): HTMLElement {
  const sort = new Signal<string>("score");
  return render(ownerDocument, () => (
    <SettingRow
      label="Sort by"
      description="A long caption, to show it wrapping under the label while the control keeps its size on the right."
      control={
        <Dropdown<string>
          choices={SORTS}
          size="small"
          value={sort}
          onValueChange={next => {
            log(`Sort by → ${next}`);
            sort.value = next;
          }}
        />
      }
    />
  )).result;
}

// The second row is disabled while the first is on: the switch's signal is the stepper's disabled state.
function renderDependentRows(ownerDocument: Document, log: Log): HTMLElement {
  const infiniteScroll = new Signal(false);
  const resultsPerPage = new Signal(50);
  return render(ownerDocument, () => (
    <div>
      <SettingRow
        label="Infinite scroll"
        control={
          <Switch
            value={infiniteScroll}
            onValueChange={next => {
              log(`Infinite scroll → ${next}`);
              infiniteScroll.value = next;
            }}
          />
        }
      />
      <SettingRow
        label="Results per page"
        description="Disabled while infinite scroll is on."
        control={
          <Stepper
            label="Results per page"
            min={10}
            max={200}
            step={10}
            size="small"
            scheduler={SCHEDULER}
            value={resultsPerPage}
            disabled={infiniteScroll}
            onValueChange={next => {
              log(`Results per page → ${next}`);
              resultsPerPage.value = next;
            }}
          />
        }
      />
    </div>
  )).result;
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
