import { SettingDescriptor, SettingPreference } from "@/core/ui/settings/descriptor";
import { SettingsLayout, createSettingsScreen } from "@/core/ui/settings/screen";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { Story, StoryVariant } from "@/targets/kit/story";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { SettingSize } from "@/core/ui/settings/setting";

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

function createPreference<T>({ id, initial, log }: { id: string; initial: T; log: Log }): SettingPreference<T> {
  const signal = new Signal(initial);
  return {
    get value(): T {
      return signal.value;
    },
    set(value: T): void {
      log(`${id} → ${String(value)}`);
      signal.value = value;
    }
  };
}

interface Catalog {
  descriptors: SettingDescriptor[];
  hints: SettingPreference<boolean>;
}

function createCatalog(log: Log): Catalog {
  const hints = createPreference({ id: "hints", initial: true, log });
  const infiniteScroll = createPreference({ id: "infiniteScroll", initial: false, log });
  const descriptors: SettingDescriptor[] = [
    {
      id: "hints", kind: "switch", label: "Hints", description: "Show a caption under each setting.", preference: hints
    },
    {
      id: "ratings", kind: "choices", label: "Ratings", description: "Which ratings search includes.",
      preference: createPreference<readonly string[]>({ id: "ratings", initial: ["safe"], log }), members: RATINGS, labels: RATING_LABELS
    },
    {
      id: "layout", kind: "choice", label: "Layout", description: "How thumbnails are arranged.", variant: "segmented",
      preference: createPreference({ id: "layout", initial: "column", log }), members: LAYOUTS, labels: LAYOUT_LABELS
    },
    { id: "columns", kind: "number", label: "Columns", preference: createPreference({ id: "columns", initial: 6, log }), min: 2, max: 20, step: 1 },
    {
      id: "sort", kind: "choice", label: "Sort layout", variant: "dropdown",
      preference: createPreference({ id: "sort", initial: "row", log }), members: LAYOUTS, labels: LAYOUT_LABELS
    },
    { id: "autoplay", kind: "switch", label: "Autoplay", preference: createPreference({ id: "autoplay", initial: true, log }) },
    { id: "infiniteScroll", kind: "switch", label: "Infinite scroll", preference: infiniteScroll },
    {
      id: "resultsPerPage", kind: "number", label: "Results per page", description: "Disabled while infinite scroll is on.",
      preference: createPreference({ id: "resultsPerPage", initial: 50, log }), min: 10, max: 200, step: 10,
      enabledWhen: () => !infiniteScroll.value
    }
  ];
  return { descriptors, hints };
}

// Both hosts lay out the same catalog, so a change in one shows in the other.
function createHostVariants(): StoryVariant[] {
  let catalog: Catalog | undefined;
  const host = (label: string, { layout, size, open }: { layout: SettingsLayout; size: SettingSize; open: string[] }): StoryVariant => ({
    label,
    render: (ownerDocument, log): HTMLElement => {
      const panel = ownerDocument.createElement("div");
      const expanded = createPreference<readonly string[]>({ id: `${label} expanded`, initial: open, log });

      catalog ??= createCatalog(log);
      const { descriptors, hints } = catalog;
      const screen = createSettingsScreen(ownerDocument, { layout, descriptors, expanded, size, scheduler: SCHEDULER });

      effect(() => screen.setDescriptionsVisible(hints.value));
      panel.className = "kit-Panel";
      panel.dataset.size = size;
      panel.append(screen.element);
      return panel;
    }
  });
  return [
    host("Favorites drawer", { layout: FAVORITES_LAYOUT, size: "medium", open: ["general", "layout"] }),
    host("Post-list menu", { layout: POST_LIST_LAYOUT, size: "small", open: ["paging"] })
  ];
}

export const SETTINGS_SCREEN_STORY: Story = {
  title: "Settings screen (two hosts, one catalog)",
  variants: createHostVariants()
};
