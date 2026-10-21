import { Readable } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const LightboxPreviewClass = {
  root: "fsg-LightboxPreview"
} as const;

export interface LightboxPreviewProps {
  src: Readable<string>;
  hidden: Readable<boolean>;
}

export function LightboxPreview({ src, hidden }: LightboxPreviewProps): HTMLImageElement {
  return <img className={LightboxPreviewClass.root} alt="" hidden={hidden} src={src} /> as HTMLImageElement;
}
