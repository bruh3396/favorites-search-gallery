import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";
import { playVideo } from "@/core/features/lightbox/stage/media_elements";

export const LightboxVideoClass = {
  root: "fsg-LightboxVideo"
} as const;

export interface LightboxVideoProps {
  element: Readable<HTMLVideoElement | undefined>;
  onClick: () => void;
  onFocusIn: () => void;
}

export function LightboxVideo(props: LightboxVideoProps): HTMLElement {
  const root = (
    <div
      className={LightboxVideoClass.root}
      hidden={computed(() => props.element.value === undefined)}
      onClick={event => handleClick(event, props.onClick)}
      onFocusin={props.onFocusIn}
    />
  ) as HTMLElement;
  let shown: HTMLVideoElement | undefined;

  effect(() => {
    const video = props.element.value;

    if (video === shown) {
      return;
    }
    shown?.pause();
    root.replaceChildren(...(video === undefined ? [] : [video]));
    shown = video;

    if (video !== undefined) {
      playVideo(video);
    }
  });
  return root;
}

function handleClick(event: MouseEvent, onClick: () => void): void {
  if (event.ctrlKey || event.metaKey) {
    return;
  }
  event.preventDefault();
  onClick();
}
