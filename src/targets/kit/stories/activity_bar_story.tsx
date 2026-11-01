import { ActivityBar, ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";
import { Story, StoryVariant } from "@/targets/kit/story";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";

const ITEMS: readonly ActivityBarItem[] = [
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "downloads", label: "Downloads", icon: "download" },
  { id: "changelog", label: "Changelog", icon: "changelog" },
  { id: "help", label: "Help", icon: "help" }
];

function renderView(activityBarItem: ActivityBarItem, log: (message: string) => void): HTMLElement {
  if (activityBarItem.id !== "settings") {
    return <ViewPane title={activityBarItem.label}><p className="kit-Placeholder">{activityBarItem.label} content</p></ViewPane>;
  }
  const nothingChanged = new Signal(false);
  return (
    <ViewPane
      title={activityBarItem.label}
      actions={[
        {
          label: "Reset all",
          icon: "reset",
          disabled: nothingChanged,
          onClick: (): void => {
            log("ViewPane \"Settings\" → Reset all");
            nothingChanged.value = true;
          }
        }
      ]}
    >
      {Array.from({ length: 30 }, (_, index) => <p className="kit-Placeholder">Setting {String(index + 1)}</p>)}
    </ViewPane>
  );
}

function variant(label: string, initial: string | null): StoryVariant {
  return {
    label,
    render: (ownerDocument, log): HTMLElement => {
      const activeItemId = new Signal<string | null>(initial);
      const { result } = render(ownerDocument, () => (
        <div className="kit-Frame">
          <ActivityBar
            items={ITEMS}
            value={activeItemId}
            renderView={activityBarItem => renderView(activityBarItem, log)}
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
