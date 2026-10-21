import { Child, h } from "@/core/ui/h/h";

export const LightboxOverlayClass = {
  root: "fsg-LightboxOverlay",
  top: "fsg-LightboxOverlay-top",
  slot: "fsg-LightboxOverlay-slot",
  startEdge: "fsg-LightboxOverlay-startEdge",
  endEdge: "fsg-LightboxOverlay-endEdge"
} as const;

export interface LightboxOverlayProps {
  topStart?: Child;
  topEnd?: Child;
  startEdge?: Child;
  endEdge?: Child;
  onSlotEnter: () => void;
  onSlotLeave: () => void;
}

export function LightboxOverlay(props: LightboxOverlayProps): HTMLElement {
  const slot = (className: string, child: Child): HTMLElement => (
    <div className={className} onPointerenter={props.onSlotEnter} onPointerleave={props.onSlotLeave}>{child}</div>
  ) as HTMLElement;
  return (
    <div className={LightboxOverlayClass.root}>
      {slot(`${LightboxOverlayClass.slot} ${LightboxOverlayClass.startEdge}`, props.startEdge)}
      {slot(`${LightboxOverlayClass.slot} ${LightboxOverlayClass.endEdge}`, props.endEdge)}
      <div className={LightboxOverlayClass.top}>
        {slot(LightboxOverlayClass.slot, props.topStart)}
        {slot(LightboxOverlayClass.slot, props.topEnd)}
      </div>
    </div>
  ) as HTMLElement;
}
