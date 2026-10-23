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
