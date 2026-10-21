import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const LightboxImageClass = {
  root: "fsg-LightboxImage"
} as const;

export interface LightboxImageProps {
  bitmap: Readable<ImageBitmap | undefined>;
}

export function LightboxImage(props: LightboxImageProps): HTMLCanvasElement {
  const canvas = (
    <canvas className={LightboxImageClass.root} hidden={computed(() => props.bitmap.value === undefined)} />
  ) as HTMLCanvasElement;

  effect(() => drawBitmap(canvas, props.bitmap.value));
  return canvas;
}

function drawBitmap(canvas: HTMLCanvasElement, bitmap: ImageBitmap | undefined): void {
  canvas.width = bitmap?.width ?? 0;
  canvas.height = bitmap?.height ?? 0;

  if (bitmap !== undefined) {
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  }
}
