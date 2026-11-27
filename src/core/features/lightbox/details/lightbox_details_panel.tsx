import { Child, h } from "@/core/ui/h/h";
import { Readable, effect } from "@/core/utils/reactive/signal";

export const LightboxDetailsPanelClass = {
  root: "fsg-LightboxDetailsPanel",
  header: "fsg-LightboxDetailsPanel-header",
  title: "fsg-LightboxDetailsPanel-title",
  controls: "fsg-LightboxDetailsPanel-controls",
  content: "fsg-LightboxDetailsPanel-content"
} as const;

export interface LightboxDetailsPanelProps {
  isOpen: Readable<boolean>;
  titleChild?: Child;
  trailingChild?: Child;
  controlsChild?: Child;
  contentChild: Child;
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
        <div className={LightboxDetailsPanelClass.title}>{props.titleChild}</div>
        {props.trailingChild}
      </div>
      <div className={LightboxDetailsPanelClass.controls}>{props.controlsChild}</div>
      <div className={LightboxDetailsPanelClass.content}>{props.contentChild}</div>
    </aside>
  ) as HTMLElement;

  effect(() => {
    panel.toggleAttribute("data-open", props.isOpen.value);
    panel.inert = !props.isOpen.value;
  });
  return panel;
}
