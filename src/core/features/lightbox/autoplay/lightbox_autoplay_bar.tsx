import { Readable, effect } from "@/core/utils/reactive/signal";
import { LightboxAutoplayCountdown } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { h } from "@/core/ui/h/h";

export const LightboxAutoplayBarClass = {
  root: "fsg-LightboxAutoplayBar",
  fill: "fsg-LightboxAutoplayBar-fill"
} as const;

export interface LightboxAutoplayBarProps {
  countdown: Readable<LightboxAutoplayCountdown | undefined>;
}

export function LightboxAutoplayBar({ countdown }: LightboxAutoplayBarProps): HTMLElement {
  const root = <div className={LightboxAutoplayBarClass.root} aria-hidden="true" /> as HTMLElement;

  effect(() => {
    const currentCountdown = countdown.value;

    root.hidden = currentCountdown === undefined;
    root.replaceChildren(...(currentCountdown === undefined ? [] : [createFill(root.ownerDocument, currentCountdown.duration)]));
  });
  return root;
}

function createFill(ownerDocument: Document, duration: number): HTMLElement {
  const fill = ownerDocument.createElement("div");

  fill.className = LightboxAutoplayBarClass.fill;
  fill.style.animationDuration = `${duration}ms`;
  return fill;
}
