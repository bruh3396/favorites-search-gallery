import { SettingDescriptor, SettingPreference } from "@/core/ui/settings/descriptor";
import { h, render } from "@/core/ui/h/h";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { Setting } from "@/core/ui/settings/setting";
import { Signal } from "@/core/utils/reactive/signal";
import { Story } from "@/targets/kit/story";

const SCHEDULER = new BrowserScheduler();

const LAYOUTS = ["column", "row", "square"] as const;
const LAYOUT_LABELS = { column: "Column", row: "Row", square: "Square" };

const RATINGS = ["safe", "questionable", "explicit"] as const;
const RATING_LABELS = { safe: "Safe", questionable: "Questionable", explicit: "Explicit" };

type Log = (message: string) => void;

function createPreference<T>({ id, initial, log }: { id: string; initial: T; log: Log }): SettingPreference<T> {
  const signal = new Signal(initial);
  return {
    get value(): T {
      return signal.value;
    },
    peek: (): T => signal.peek(),
    set(value: T): void {
      log(`${id} → ${String(value)}`);
      signal.value = value;
    }
  };
}

function renderAll(ownerDocument: Document, descriptors: readonly SettingDescriptor[]): HTMLElement {
  return render(ownerDocument, () => (
    <div>
      {descriptors.map(descriptor => <Setting descriptor={descriptor} size="small" scheduler={SCHEDULER} />)}
    </div>
  )).result;
}

function renderEveryKind(ownerDocument: Document, log: Log): HTMLElement {
  return renderAll(ownerDocument, [
    { id: "autoplay", kind: "switch", label: "Autoplay", preference: createPreference({ id: "autoplay", initial: true, log }) },
    {
      id: "layout", kind: "choice", label: "Layout", description: "How thumbnails are arranged.", control: "segmented",
      preference: createPreference({ id: "layout", initial: "column", log }), members: LAYOUTS, labels: LAYOUT_LABELS
    },
    {
      id: "sort", kind: "choice", label: "Sort layout", control: "dropdown",
      preference: createPreference({ id: "sort", initial: "row", log }), members: LAYOUTS, labels: LAYOUT_LABELS
    },
    {
      id: "ratings", kind: "choices", label: "Ratings",
      preference: createPreference<readonly string[]>({ id: "ratings", initial: ["safe"], log }), members: RATINGS, labels: RATING_LABELS
    },
    { id: "columns", kind: "number", label: "Columns", preference: createPreference({ id: "columns", initial: 6, log }), min: 2, max: 20, step: 1 }
  ]);
}

function renderDependent(ownerDocument: Document, log: Log): HTMLElement {
  const infiniteScroll = createPreference({ id: "infiniteScroll", initial: false, log });
  return renderAll(ownerDocument, [
    { id: "infiniteScroll", kind: "switch", label: "Infinite scroll", preference: infiniteScroll },
    {
      id: "resultsPerPage", kind: "number", label: "Results per page", description: "Disabled while infinite scroll is on.",
      preference: createPreference({ id: "resultsPerPage", initial: 50, log }), min: 10, max: 200, step: 10,
      disabled: infiniteScroll
    }
  ]);
}

export const SETTING_STORY: Story = {
  title: "Setting (from a descriptor)",
  variants: [
    { label: "Every kind", render: renderEveryKind },
    { label: "Disabled by another setting", render: renderDependent }
  ]
};
