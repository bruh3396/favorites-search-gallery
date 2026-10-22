import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const LightboxImageClass = {
  root: "fsg-LightboxImage"
} as const;

export interface LightboxImageProps {
  element: Readable<HTMLCanvasElement | undefined>;
}

export function LightboxImage(props: LightboxImageProps): HTMLElement {
  const root = (
    <div className={LightboxImageClass.root} hidden={computed(() => props.element.value === undefined)} />
  ) as HTMLElement;

  effect(() => root.replaceChildren(...(props.element.value === undefined ? [] : [props.element.value])));
  return root;
}

export function createLightboxImage(ownerDocument: Document, bitmap: ImageBitmap): HTMLCanvasElement {
  const canvas = ownerDocument.createElement("canvas");

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  return canvas;
}
