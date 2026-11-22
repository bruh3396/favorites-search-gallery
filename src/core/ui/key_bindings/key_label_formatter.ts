const KEY_LABELS: Readonly<Record<string, string>> = {
  " ": "Space",
  ArrowRight: "→",
  ArrowLeft: "←",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Escape: "Esc",
  Backspace: "Bksp",
  Delete: "Del"
};

export function formatKeyLabel(key: string): string {
  return KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}
