import { LIGHTBOX_COMMAND_DEFINITIONS, LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { formatCommandTitle } from "@/core/ui/key_bindings/command_title_formatter";

export function formatLightboxCommandTitle(
  lightboxCommand: LightboxCommand,
  lightboxKeyBindings: KeyBindings<LightboxCommand>,
  label: string = LIGHTBOX_COMMAND_DEFINITIONS[lightboxCommand].label
): string {
  return formatCommandTitle(label, lightboxKeyBindings[lightboxCommand]);
}
