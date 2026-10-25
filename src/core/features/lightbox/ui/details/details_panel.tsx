import { Child, h } from "@/core/ui/h/h";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { LightboxButton } from "@/core/features/lightbox/ui/chrome/button";
import { LightboxShortcut } from "@/core/features/lightbox/input/shortcut";

export const LightboxDetailsPanelClass = {
  root: "fsg-LightboxDetailsPanel",
  header: "fsg-LightboxDetailsPanel-header",
  title: "fsg-LightboxDetailsPanel-title",
  controls: "fsg-LightboxDetailsPanel-controls",
  content: "fsg-LightboxDetailsPanel-content"
} as const;

export interface LightboxDetailsPanelProps {
  isOpen: Readable<boolean>;
  title?: Child;
  controls?: Child;
  content: Child;
  closeShortcut?: LightboxShortcut;
  onClose: () => void;
  onPointerenter: () => void;
  onPointerleave: () => void;
}

export function LightboxDetailsPanel(props: LightboxDetailsPanelProps): HTMLElement {
  const panel = (
    <aside
      className={LightboxDetailsPanelClass.root}
      aria-label="Details"
      onPointerenter={props.onPointerenter}
      onPointerleave={props.onPointerleave}
    >
      <div className={LightboxDetailsPanelClass.header}>
        <div className={LightboxDetailsPanelClass.title}>{props.title}</div>
        <LightboxButton icon="close" label="Hide details" shortcut={props.closeShortcut} onClick={props.onClose} />
      </div>
      <div className={LightboxDetailsPanelClass.controls}>{props.controls}</div>
      <div className={LightboxDetailsPanelClass.content}>{props.content}</div>
    </aside>
  ) as HTMLElement;

  effect(() => {
    panel.toggleAttribute("data-open", props.isOpen.value);
    panel.inert = !props.isOpen.value;
  });
  return panel;
}
