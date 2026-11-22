import { KeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { Readable } from "@/core/utils/reactive/signal";
import { StoredValue } from "@/core/utils/storage/stored_value";

export interface LightboxPreferences {
  readonly mode: Readable<LightboxMode>;
  readonly volume: StoredValue<number>;
  readonly muted: StoredValue<boolean>;
  readonly keyBindingOverrides: Readable<KeyBindingOverrides<LightboxCommand>>;
}
