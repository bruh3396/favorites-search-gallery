import { ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";

export const FAVORITES_SETTINGS_TOOL: Omit<ActivityBarItem, "renderView"> = { id: "settings", label: "Settings", icon: "settings" };
