import { formatKeyLabel } from "@/core/ui/key_bindings/key_label_formatter";

export function formatCommandTitle(label: string, keys: readonly string[]): string {
  return keys.length === 0 ? label : `${label} (${formatKeyLabel(keys[0])})`;
}
