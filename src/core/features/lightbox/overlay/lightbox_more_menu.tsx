import { CommandHandlers } from "@/core/ui/key_bindings/command_handlers";
import { ContextMenu } from "@/core/ui/components/context_menu/context_menu";
import { ContextMenuItem } from "@/core/ui/components/context_menu/context_menu_item";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { LightboxButton } from "@/core/features/lightbox/overlay/lightbox_button";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { Readable } from "@/core/utils/reactive/signal";
import { formatKeyLabel } from "@/core/ui/key_bindings/key_label_formatter";
import { h } from "@/core/ui/h/h";

export interface LightboxMoreMenuProps {
  handlers: Pick<CommandHandlers<LightboxCommand>, "openPostPage" | "download" | "openOriginal" | "toggleZoom" | "toggleMute">;
  lightboxKeyBindings: Readable<KeyBindings<LightboxCommand>>;
  lightboxZoom: Pick<LightboxZoom, "isZoomed" | "canZoom">;
  muted: Readable<boolean>;
  canMute: Readable<boolean>;
  onOpenChange: (isOpen: boolean) => void;
}

interface MoreMenuState {
  readonly isZoomed: boolean;
  readonly canZoom: boolean;
  readonly isMuted: boolean;
  readonly canMute: boolean;
}

export function LightboxMoreMenu({ handlers, lightboxKeyBindings, lightboxZoom, muted, canMute, onOpenChange }: LightboxMoreMenuProps): HTMLElement {
  return h(ContextMenu, {
    target: h(LightboxButton, { icon: "more", label: "More" }),
    opensOn: "click",
    listItems: () => listMoreMenuItems(handlers, lightboxKeyBindings.peek(), {
      isZoomed: lightboxZoom.isZoomed.peek(),
      canZoom: lightboxZoom.canZoom.peek(),
      isMuted: muted.peek(),
      canMute: canMute.peek()
    }),
    onOpenChange
  });
}

function listMoreMenuItems(
  handlers: LightboxMoreMenuProps["handlers"],
  lightboxKeyBindings: KeyBindings<LightboxCommand>,
  { isZoomed, canZoom, isMuted, canMute }: MoreMenuState
): readonly ContextMenuItem[] {
  const readShortcut = (lightboxCommand: LightboxCommand): string | undefined => {
    const [key] = lightboxKeyBindings[lightboxCommand];
    return key === undefined ? undefined : formatKeyLabel(key);
  };
  const contextMenuItems: ContextMenuItem[] = [
    { label: "Post Page", icon: "fileText", shortcut: readShortcut("openPostPage"), onChoose: handlers.openPostPage },
    { label: "Download", icon: "download", shortcut: readShortcut("download"), onChoose: handlers.download },
    { label: "Original File", icon: "image", shortcut: readShortcut("openOriginal"), onChoose: handlers.openOriginal },
    {
      label: "Zoom",
      icon: isZoomed ? "zoomOut" : "zoomIn",
      shortcut: readShortcut("toggleZoom"),
      checked: isZoomed,
      disabled: !isZoomed && !canZoom,
      startsGroup: true,
      onChoose: handlers.toggleZoom
    }
  ];

  if (canMute) {
    contextMenuItems.push({
      label: "Mute",
      icon: isMuted ? "volumeOff" : "volume",
      shortcut: readShortcut("toggleMute"),
      checked: isMuted,
      onChoose: handlers.toggleMute
    });
  }
  return contextMenuItems;
}
