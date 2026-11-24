import { Story, StoryVariant } from "@/targets/kit/story";
import { h, render } from "@/core/ui/h/h";
import { ActivityBar } from "@/core/ui/components/activity_bar/activity_bar";
import { Signal } from "@/core/utils/reactive/signal";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";

const STORY_ITEMS = {
  settings: { label: "Settings", icon: "settings" },
  downloads: { label: "Downloads", icon: "download" },
  changelog: { label: "Changelog", icon: "changelog" },
  help: { label: "Help", icon: "help" }
} as const;

type StoryItemId = keyof typeof STORY_ITEMS;

function renderPlaceholderView(label: string): HTMLElement {
  return <ViewPane title={label}><p className="kit-Placeholder">{label} content</p></ViewPane>;
}

function renderSettingsView(log: (message: string) => void): HTMLElement {
  const nothingChanged = new Signal(false);
  return (
    <ViewPane
      title="Settings"
      actions={[
        {
          label: "Reset Settings",
          icon: "reset",
          disabled: nothingChanged,
          onClick: (): void => {
            log("ViewPane \"Settings\" → Reset Settings");
            nothingChanged.value = true;
          }
        }
      ]}
    >
      {Array.from({ length: 30 }, (_, index) => <p className="kit-Placeholder">Setting {String(index + 1)}</p>)}
    </ViewPane>
  );
}

function variant(label: string, initial: StoryItemId | null): StoryVariant {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const activeItemId = new Signal<StoryItemId | null>(initial);
      const { result } = render(ownerDocument, () => (
        <div className="kit-Frame">
          <ActivityBar
            items={STORY_ITEMS}
            value={activeItemId}
            renderViewById={{
              settings: () => renderSettingsView(log),
              downloads: () => renderPlaceholderView("Downloads"),
              changelog: () => renderPlaceholderView("Changelog"),
              help: () => renderPlaceholderView("Help")
            }}
            onValueChange={next => {
              log(`ActivityBar "${label}" → ${String(next)}`);
              activeItemId.value = next;
            }}
          />
        </div>
      ));
      return result;
    }
  };
}

export const ACTIVITY_BAR_STORY: Story = {
  title: "Activity bar",
  variants: [
    variant("Closed", null),
    variant("Settings open", "settings")
  ]
};
