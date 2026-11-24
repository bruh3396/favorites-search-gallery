export const FAVORITES_TOOL_DEFINITIONS = {
  settings: { label: "Settings", icon: "settings" },
  keyBindings: { label: "Keyboard Shortcuts", icon: "keyboard" },
  snippets: { label: "Snippets", icon: "bookmark" }
} as const;

export type FavoritesTool = keyof typeof FAVORITES_TOOL_DEFINITIONS;
