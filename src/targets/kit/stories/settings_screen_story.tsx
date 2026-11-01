import { Story, StoryVariant } from "@/targets/kit/story";
import { h, render } from "@/core/ui/h/h";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/browser_scheduler";
import { ControlSize } from "@/core/ui/components/control/control_size";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SettingPreference } from "@/core/ui/settings/setting_preference";
import { SettingsLayout } from "@/core/ui/settings/settings_layout";
import { SettingsScreen } from "@/core/ui/settings/settings_screen";
import { Signal } from "@/core/utils/reactive/signal";

const SCHEDULER = new BrowserScheduler();

const LAYOUTS = ["column", "row", "square"] as const;
const LAYOUT_LABELS = { column: "Column", row: "Row", square: "Square" };

const RATINGS = ["safe", "questionable", "explicit"] as const;
const RATING_LABELS = { safe: "Safe", questionable: "Questionable", explicit: "Explicit" };

const FAVORITES_LAYOUT: SettingsLayout = [
  { id: "general", title: "General", settings: ["hints", "ratings"] },
  { id: "layout", title: "Layout", settings: ["layout", "columns", "sort"] },
  { id: "gallery", title: "Gallery", settings: ["autoplay"] },
  { id: "paging", title: "Paging", settings: ["infiniteScroll", "resultsPerPage"] }
];

const POST_LIST_LAYOUT: SettingsLayout = [
  { id: "general", title: "General", settings: ["hints", "autoplay"] },
  { id: "paging", title: "Paging", settings: ["infiniteScroll", "resultsPerPage"] },
  { id: "layout", title: "Layout", settings: ["columns"] }
];

type Log = (message: string) => void;

function createStoredValue<T>({ id, initial, log }: { id: string; initial: T; log: Log }): SettingPreference<T> {
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

interface Catalog {
  readonly settingDescriptors: SettingDescriptor[];
  readonly hintsSettingPreference: SettingPreference<boolean>;
}

function createCatalog(log: Log): Catalog {
  const hintsSettingPreference = createStoredValue({ id: "hints", initial: true, log });
  const infiniteScrollSettingPreference = createStoredValue({ id: "infiniteScroll", initial: false, log });
  const settingDescriptors: SettingDescriptor[] = [
    {
      id: "hints", kind: "switch", label: "Hints", description: "Show a caption under each setting.", settingPreference: hintsSettingPreference
    },
    {
      id: "ratings", kind: "choices", label: "Ratings", description: "Which ratings search includes.",
      settingPreference: createStoredValue<readonly string[]>({ id: "ratings", initial: ["safe"], log }), members: RATINGS, labels: RATING_LABELS
    },
    {
      id: "layout", kind: "choice", label: "Layout", description: "How thumbnails are arranged.", control: "segmented",
      settingPreference: createStoredValue({ id: "layout", initial: "column", log }), members: LAYOUTS, labels: LAYOUT_LABELS
    },
    { id: "columns", kind: "number", label: "Columns", settingPreference: createStoredValue({ id: "columns", initial: 6, log }), min: 2, max: 20, step: 1 },
    {
      id: "sort", kind: "choice", label: "Sort layout", control: "dropdown",
      settingPreference: createStoredValue({ id: "sort", initial: "row", log }), members: LAYOUTS, labels: LAYOUT_LABELS
    },
    { id: "autoplay", kind: "switch", label: "Autoplay", settingPreference: createStoredValue({ id: "autoplay", initial: true, log }) },
    { id: "infiniteScroll", kind: "switch", label: "Infinite scroll", settingPreference: infiniteScrollSettingPreference },
    {
      id: "resultsPerPage", kind: "number", label: "Results per page", description: "Disabled while infinite scroll is on.",
      settingPreference: createStoredValue({ id: "resultsPerPage", initial: 50, log }), min: 10, max: 200, step: 10,
      disabled: infiniteScrollSettingPreference
    }
  ];
  return { settingDescriptors, hintsSettingPreference };
}

function createHostVariants(): StoryVariant[] {
  let catalog: Catalog | undefined;
  const host = (label: string, { settingsLayout, controlSize }: { settingsLayout: SettingsLayout; controlSize: ControlSize }): StoryVariant => ({
    label,
    render: (ownerDocument, log): HTMLElement => {
      catalog ??= createCatalog(log);
      const { settingDescriptors, hintsSettingPreference } = catalog;
      return render(ownerDocument, () => (
        <div className="kit-Panel" dataset={{ size: controlSize }}>
          <SettingsScreen
            settingsLayout={settingsLayout}
            settingDescriptors={settingDescriptors}
            controlSize={controlSize}
            stepperScheduler={SCHEDULER}
            descriptionsVisible={hintsSettingPreference}
          />
        </div>
      )).result;
    }
  });
  return [
    host("Favorites drawer", { settingsLayout: FAVORITES_LAYOUT, controlSize: "medium" }),
    host("Post-list menu", { settingsLayout: POST_LIST_LAYOUT, controlSize: "small" })
  ];
}

export const SETTINGS_SCREEN_STORY: Story = {
  title: "Settings screen (two hosts, one catalog)",
  variants: createHostVariants()
};
