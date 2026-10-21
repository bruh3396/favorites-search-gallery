import { Readable, computed } from "@/core/utils/reactive/signal";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Resource } from "@/core/utils/reactive/resource";
import { h } from "@/core/ui/h/h";

export const LightboxPreviewClass = {
  root: "fsg-LightboxPreview"
} as const;

export interface LightboxPreviewProps<T extends MediaItem> {
  item: Readable<T | undefined>;
  hidden: Readable<boolean>;
  resolvePreviewUrl: (media: Media) => Promise<string>;
}

export function LightboxPreview<T extends MediaItem>(props: LightboxPreviewProps<T>): HTMLImageElement {
  const url = new Resource({ source: props.item, load: (item: T): Promise<string> => props.resolvePreviewUrl(item.media) });
  return <img className={LightboxPreviewClass.root} alt="" hidden={props.hidden} src={computed(() => url.value.value ?? "")} /> as HTMLImageElement;
}
