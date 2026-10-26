import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const LightboxPreviewClass = {
  root: "fsg-LightboxPreview"
} as const;

export interface LightboxPreviewProps {
  src: Readable<string | undefined>;
}

export function LightboxPreview({ src }: LightboxPreviewProps): HTMLImageElement {
  return (
    <img
      className={LightboxPreviewClass.root}
      alt=""
      hidden={computed(() => src.value === undefined)}
      src={computed(() => src.value ?? "")}
    />
  ) as HTMLImageElement;
}
