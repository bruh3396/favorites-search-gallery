import { Child, h } from "@/core/ui/h/h";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/ui/overlay/visibility";
import { computed } from "@/core/utils/reactive/signal";

export const LightboxOverlayClass = {
  root: "fsg-LightboxOverlay",
  top: "fsg-LightboxOverlay-top",
  slot: "fsg-LightboxOverlay-slot",
  topStart: "fsg-LightboxOverlay-topStart",
  topEnd: "fsg-LightboxOverlay-topEnd",
  start: "fsg-LightboxOverlay-start",
  end: "fsg-LightboxOverlay-end"
} as const;

export interface LightboxOverlayProps {
  visibility: LightboxOverlayVisibility;
  topEdge?: Child;
  topStart?: Child;
  topEnd?: Child;
  start?: Child;
  end?: Child;
}

export function LightboxOverlay(props: LightboxOverlayProps): HTMLElement {
  const { visibility } = props;
  const slot = (className: string, controls: Child): HTMLElement => (
    <div
      className={`${LightboxOverlayClass.slot} ${className}`}
      onPointerenter={() => visibility.hold()}
      onPointerleave={() => visibility.release()}
      onClick={event => event.stopPropagation()}
    >
      {controls}
    </div>
  );
  return (
    <div className={LightboxOverlayClass.root} dataset={{ shown: computed(() => String(visibility.shown.value)) }}>
      {props.topEdge}
      <div className={LightboxOverlayClass.top}>
        {slot(LightboxOverlayClass.topStart, props.topStart)}
        {slot(LightboxOverlayClass.topEnd, props.topEnd)}
      </div>
      {slot(LightboxOverlayClass.start, props.start)}
      {slot(LightboxOverlayClass.end, props.end)}
    </div>
  );
}
