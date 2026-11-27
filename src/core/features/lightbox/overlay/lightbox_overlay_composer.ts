import { LIGHTBOX_COMMAND_DEFINITIONS, LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { LightboxMoreMenu, LightboxMoreMenuProps } from "@/core/features/lightbox/overlay/lightbox_more_menu";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { CommandHandlers } from "@/core/ui/key_bindings/command_handlers";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { LightboxArrow } from "@/core/features/lightbox/navigation/lightbox_arrow";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/lightbox_autoplay";
import { LightboxAutoplayBar } from "@/core/features/lightbox/autoplay/lightbox_autoplay_bar";
import { LightboxButtonProps } from "@/core/features/lightbox/overlay/lightbox_button";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxFavorite } from "@/core/features/lightbox/favorite/lightbox_favorite";
import { LightboxFullscreen } from "@/core/features/lightbox/lightbox_fullscreen";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/lightbox_navigation";
import { LightboxOverlay } from "@/core/features/lightbox/overlay/lightbox_overlay";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/overlay/lightbox_overlay_visibility";
import { LightboxPosition } from "@/core/features/lightbox/navigation/lightbox_position";
import { LightboxStage } from "@/core/features/lightbox/media/lightbox_stage";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { MediaItem } from "@/core/domain/media/media_item";
import { formatLightboxCommandTitle } from "@/core/features/lightbox/commands/lightbox_command_title_formatter";
import { h } from "@/core/ui/h/h";

export interface LightboxOverlayDependencies<T extends MediaItem> {
  visibility: Pick<LightboxOverlayVisibility, "hold" | "release">;
  lightboxNavigation: Pick<LightboxNavigation<T>, "currentItem" | "position">;
  lightboxStage: Pick<LightboxStage<T>, "video">;
  lightboxZoom: Pick<LightboxZoom, "isZoomed" | "canZoom">;
  lightboxAutoplay: Pick<LightboxAutoplay, "countdown" | "isPlaying">;
  lightboxFullscreen: Pick<LightboxFullscreen, "inFullscreen">;
  muted: Readable<boolean>;
  lightboxKeyBindings: Readable<KeyBindings<LightboxCommand>>;
  handlers: LightboxMoreMenuProps["handlers"] & Pick<CommandHandlers<LightboxCommand>, "showPrevious" | "showNext">;
  createLightboxCommandButton: (
    lightboxCommand: LightboxCommand,
    lightboxButtonProps: Pick<LightboxButtonProps, "icon" | "pressed"> & Partial<Pick<LightboxButtonProps, "label">>
  ) => HTMLElement;
  onMoreMenuOpenChange: (isOpen: boolean) => void;
  lightboxDetails?: Pick<LightboxDetails<T>, "isOpen">;
  lightboxFavorite?: Pick<LightboxFavorite<T>, "isFavorited">;
}

export function composeLightboxOverlay<T extends MediaItem>(dependencies: LightboxOverlayDependencies<T>): HTMLElement {
  const { visibility: lightboxOverlayVisibility, lightboxNavigation, lightboxStage, lightboxZoom, lightboxAutoplay, lightboxFullscreen } = dependencies;
  const { muted, lightboxKeyBindings, handlers, createLightboxCommandButton, onMoreMenuOpenChange, lightboxDetails, lightboxFavorite } = dependencies;
  const isFavorited = computed(() => {
    const currentItem = lightboxNavigation.currentItem.value;
    return currentItem !== undefined && lightboxFavorite?.isFavorited(currentItem) === true;
  });
  return h(LightboxOverlay, {
    onSlotEnter: () => lightboxOverlayVisibility.hold(), onSlotLeave: () => lightboxOverlayVisibility.release(),
    topEdgeChild: h(LightboxAutoplayBar, { countdown: lightboxAutoplay.countdown }),
    topStartChild: h(LightboxPosition, { position: lightboxNavigation.position }),
    topEndChild: [
      lightboxFavorite === undefined ? undefined : createLightboxCommandButton("addFavorite", {
        icon: computed(() => (isFavorited.value ? "heartFilled" : "heartPlus")),
        label: computed(() => (isFavorited.value ? "Favorited" : "Add to Favorites"))
      }),
      lightboxDetails === undefined ? undefined : createLightboxCommandButton("toggleDetails", {
        icon: "info", label: "Details", pressed: lightboxDetails.isOpen
      }),
      createLightboxCommandButton("toggleAutoplay", {
        icon: computed(() => (lightboxAutoplay.isPlaying.value ? "pause" : "play")), label: "Autoplay", pressed: lightboxAutoplay.isPlaying
      }),
      createLightboxCommandButton("toggleFullscreen", {
        icon: computed(() => (lightboxFullscreen.inFullscreen.value ? "exitFullscreen" : "fullscreen")),
        label: "Fullscreen", pressed: lightboxFullscreen.inFullscreen
      }),
      h(LightboxMoreMenu, {
        handlers, lightboxKeyBindings, lightboxZoom, muted, canMute: computed(() => lightboxStage.video.value !== undefined),
        onOpenChange: isOpen => {
          onMoreMenuOpenChange(isOpen);

          if (isOpen) {
            lightboxOverlayVisibility.hold();
          } else {
            lightboxOverlayVisibility.release();
          }
        }
      }),
      createLightboxCommandButton("close", { icon: "closeLarge" })
    ],
    startEdgeChild: h(LightboxArrow, {
      direction: "previous", label: LIGHTBOX_COMMAND_DEFINITIONS.showPrevious.label,
      title: computed(() => formatLightboxCommandTitle("showPrevious", lightboxKeyBindings.value)), onClick: handlers.showPrevious
    }),
    endEdgeChild: h(LightboxArrow, {
      direction: "next", label: LIGHTBOX_COMMAND_DEFINITIONS.showNext.label,
      title: computed(() => formatLightboxCommandTitle("showNext", lightboxKeyBindings.value)), onClick: handlers.showNext
    })
  });
}
