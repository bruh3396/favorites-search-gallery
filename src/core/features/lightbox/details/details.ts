import { Child } from "@/core/ui/h/h";
import { MediaItem } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { Readable } from "@/core/utils/reactive/signal";

export interface LightboxDetails<T extends MediaItem> {
  readonly isOpen: Preference<boolean>;
  createContent(currentItem: Readable<T | undefined>): Child;
}
