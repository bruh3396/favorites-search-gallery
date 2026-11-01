import { Child, h } from "@/core/ui/h/h";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LightboxArrow } from "@/core/features/lightbox/navigation/lightbox_arrow";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { LightboxMouseListeners } from "@/core/features/lightbox/commands/lightbox_mouse_listeners";
import { LightboxOverlay } from "@/core/features/lightbox/overlay/lightbox_overlay";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay/lightbox_overlay_visibility";
import { findLightboxShortcut } from "@/core/features/lightbox/commands/lightbox_shortcut_finder";

export const LightboxDialogClass = {
  root: "fsg-LightboxDialog"
} as const;

export interface LightboxDialogProps {
  isOpen: Readable<boolean>;
  simple: Readable<boolean>;
  detailsOpen?: Readable<boolean>;
  lightboxOverlayVisibility: Pick<LightboxOverlayVisibility, "visible" | "wake" | "leave" | "hold" | "release">;
  handlers: Pick<CommandHandlers<LightboxCommand>, "close" | "showPrevious" | "showNext">;
  keymap: Keymap<LightboxCommand>;
  onKeydown: (event: KeyboardEvent) => void;
  lightboxMouseListeners: LightboxMouseListeners;
  renderViewport: (onMediaFocus: () => void) => Child;
  positionChild: Child;
  autoplayBarChild: Child;
  toolbarChild: Child;
  zoomChild: Child;
  detailsPanelChild?: Child;
}

export function LightboxDialog(props: LightboxDialogProps): HTMLDialogElement {
  const { lightboxOverlayVisibility, handlers, keymap, simple, detailsOpen } = props;
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
      <LightboxOverlay
        onSlotEnter={() => lightboxOverlayVisibility.hold()}
        onSlotLeave={() => lightboxOverlayVisibility.release()}
        topEdgeChild={props.autoplayBarChild}
        topStartChild={props.positionChild}
        topEndChild={props.toolbarChild}
        startEdgeChild={
          <LightboxArrow direction="previous" lightboxShortcut={findLightboxShortcut(keymap, "showPrevious")} onClick={handlers.showPrevious} />
        }
        endEdgeChild={<LightboxArrow direction="next" lightboxShortcut={findLightboxShortcut(keymap, "showNext")} onClick={handlers.showNext} />}
      />
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
