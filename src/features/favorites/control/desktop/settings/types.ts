import { SettingsControl } from "@/lib/ui/settings/controls";

export interface SettingsSection {
  title: string;
  controls: SettingsControl[];
}
