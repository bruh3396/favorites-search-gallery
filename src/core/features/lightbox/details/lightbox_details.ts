import { LightboxDetailsContent } from "@/core/features/lightbox/details/lightbox_details_content";
import { MediaItem } from "@/core/domain/media/media_item";
import { Readable } from "@/core/utils/reactive/signal";
import { StoredValue } from "@/core/utils/storage/stored_value";

export interface LightboxDetails<T extends MediaItem> {
  readonly isOpen: StoredValue<boolean>;
  createContent(currentItem: Readable<T | undefined>): LightboxDetailsContent;
}
