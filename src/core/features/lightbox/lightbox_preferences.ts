import { LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { Readable } from "@/core/utils/reactive/signal";
import { StoredValue } from "@/core/utils/storage/stored_value";

export interface LightboxPreferences {
  readonly mode: Readable<LightboxMode>;
  readonly volume: StoredValue<number>;
  readonly muted: StoredValue<boolean>;
}
