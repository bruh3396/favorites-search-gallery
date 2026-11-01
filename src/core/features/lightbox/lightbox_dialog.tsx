import { Child, h } from "@/core/ui/h/h";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { LightboxMouseListeners } from "@/core/features/lightbox/commands/lightbox_mouse_listeners";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay/lightbox_overlay_visibility";

export const LightboxDialogClass = {
  root: "fsg-LightboxDialog"
} as const;

export interface LightboxDialogProps {
  isOpen: Readable<boolean>;
  simple: Readable<boolean>;
  detailsOpen?: Readable<boolean>;
  lightboxOverlayVisibility: Pick<LightboxOverlayVisibility, "visible" | "wake" | "leave">;
  handlers: Pick<CommandHandlers<LightboxCommand>, "close">;
  onKeydown: (event: KeyboardEvent) => void;
  lightboxMouseListeners: LightboxMouseListeners;
  renderViewport: (onMediaFocus: () => void) => Child;
  overlayChild: Child;
  zoomChild: Child;
  detailsPanelChild?: Child;
}

export function LightboxDialog(props: LightboxDialogProps): HTMLDialogElement {
  const { lightboxOverlayVisibility, handlers, simple, detailsOpen } = props;
  const dialog = (
    <dialog
      className={LightboxDialogClass.root}
      aria-label="Gallery"
      tabIndex={-1}
      onClose={handlers.close}
      onKeydown={props.onKeydown}
      onPointermove={() => lightboxOverlayVisibility.wake()}
      onPointerleave={() => lightboxOverlayVisibility.leave()}
      {...props.lightboxMouseListeners}
    >
      {props.renderViewport(() => dialog.focus({ preventScroll: true }))}
      {props.overlayChild}
      {props.zoomChild}
      {props.detailsPanelChild}
    </dialog>
  ) as HTMLDialogElement;

  effect(() => {
    if (!props.isOpen.value) {
      dialog.close();
      return;
    }
    dialog.showModal();
    dialog.focus({ preventScroll: true });
    lightboxOverlayVisibility.wake();
  });
  effect(() => dialog.toggleAttribute("data-idle", !lightboxOverlayVisibility.visible.value));
  effect(() => dialog.toggleAttribute("data-simple", simple.value));
  effect(() => dialog.toggleAttribute("data-details-open", !simple.value && (detailsOpen?.value ?? false)));
  return dialog;
}
