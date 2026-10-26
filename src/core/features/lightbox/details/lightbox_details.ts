import { Child } from "@/core/ui/h/h";
import { MediaItem } from "@/core/domain/media/media_item";
import { Preference } from "@/core/utils/preference/preference";
import { Readable } from "@/core/utils/reactive/signal";

export interface LightboxDetailsContent {
  readonly title?: Child;
  readonly controls?: Child;
  readonly body: Child;
}

export interface LightboxDetails<T extends MediaItem> {
  readonly isOpen: Preference<boolean>;
  createContent(currentItem: Readable<T | undefined>): LightboxDetailsContent;
}
