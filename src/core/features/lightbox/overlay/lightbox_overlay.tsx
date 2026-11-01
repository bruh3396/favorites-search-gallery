import { Child, h } from "@/core/ui/h/h";

export const LightboxOverlayClass = {
  root: "fsg-LightboxOverlay",
  top: "fsg-LightboxOverlay-top",
  slot: "fsg-LightboxOverlay-slot",
  startEdge: "fsg-LightboxOverlay-startEdge",
  endEdge: "fsg-LightboxOverlay-endEdge"
} as const;

export interface LightboxOverlayProps {
  topEdgeChild?: Child;
  topStartChild?: Child;
  topEndChild?: Child;
  startEdgeChild?: Child;
  endEdgeChild?: Child;
  onSlotEnter: () => void;
  onSlotLeave: () => void;
}

export function LightboxOverlay(props: LightboxOverlayProps): HTMLElement {
  const slot = (className: string, child: Child): HTMLElement => (
    <div className={className} onPointerenter={props.onSlotEnter} onPointerleave={props.onSlotLeave}>{child}</div>
  ) as HTMLElement;
  return (
    <div className={LightboxOverlayClass.root}>
      {slot(`${LightboxOverlayClass.slot} ${LightboxOverlayClass.startEdge}`, props.startEdgeChild)}
      {slot(`${LightboxOverlayClass.slot} ${LightboxOverlayClass.endEdge}`, props.endEdgeChild)}
      <div className={LightboxOverlayClass.top}>
        {slot(LightboxOverlayClass.slot, props.topStartChild)}
        {slot(LightboxOverlayClass.slot, props.topEndChild)}
      </div>
      {props.topEdgeChild}
    </div>
  ) as HTMLElement;
}
