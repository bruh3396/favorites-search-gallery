import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const LightboxGifClass = {
  root: "fsg-LightboxGif"
} as const;

export interface LightboxGifProps {
  element: Readable<HTMLImageElement | undefined>;
}

export function LightboxGif(props: LightboxGifProps): HTMLElement {
  const root = (
    <div className={LightboxGifClass.root} hidden={computed(() => props.element.value === undefined)} />
  ) as HTMLElement;

  effect(() => root.replaceChildren(...(props.element.value === undefined ? [] : [props.element.value])));
  return root;
}
