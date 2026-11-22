import { ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";

export const FAVORITES_KEY_BINDINGS_TOOL: Omit<ActivityBarItem, "renderView"> = { id: "keyBindings", label: "Keyboard Shortcuts", icon: "keyboard" };
