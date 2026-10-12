import { Readable, effect } from "@/core/utils/reactive/signal";
import { AutoplayCountdown } from "@/core/features/lightbox/autoplay/autoplay";
import { h } from "@/core/ui/h/h";

export const LightboxAutoplayBarClass = {
  root: "fsg-LightboxAutoplayBar",
  fill: "fsg-LightboxAutoplayBar-fill"
} as const;

export interface LightboxAutoplayBarProps {
  countdown: Readable<AutoplayCountdown | undefined>;
}

export function LightboxAutoplayBar({ countdown }: LightboxAutoplayBarProps): HTMLElement {
  const root = <div className={LightboxAutoplayBarClass.root} aria-hidden="true" /> as HTMLElement;

  effect(() => {
    const shown = countdown.value;

    root.replaceChildren();
    root.hidden = shown === undefined;

    if (shown !== undefined) {
      const fill = root.ownerDocument.createElement("div");

      fill.className = LightboxAutoplayBarClass.fill;
      fill.style.animationDuration = `${shown.duration}ms`;
      root.append(fill);
    }
  });
  return root;
}
