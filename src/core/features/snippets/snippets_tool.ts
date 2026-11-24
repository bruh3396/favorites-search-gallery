import { ActivityBarItem } from "@/core/ui/components/activity_bar/activity_bar";

export const SNIPPETS_TOOL: Omit<ActivityBarItem, "renderView"> = { id: "snippets", label: "Snippets", icon: "bookmark" };
