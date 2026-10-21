import { LightboxFavoriteButton, LightboxFavoriteButtonProps } from "@/core/features/lightbox/ui/controls/favorite_button/favorite_button";
import { LightboxOverlay, LightboxOverlayProps } from "@/core/features/lightbox/ui/overlay/overlay";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { LightboxArrow } from "@/core/features/lightbox/ui/controls/arrow/arrow";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxAutoplayBar } from "@/core/features/lightbox/ui/controls/autoplay_bar/autoplay_bar";
import { LightboxButton } from "@/core/features/lightbox/ui/controls/button/button";
import { LightboxCommands } from "@/core/features/lightbox/commands/commands";
import { LightboxFullscreen } from "@/core/features/lightbox/ui/screen/fullscreen";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/ui/overlay/visibility";
import { LightboxPosition } from "@/core/features/lightbox/ui/controls/position/position";
import { LightboxZoom } from "@/core/features/lightbox/zoom/zoom";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { h } from "@/core/ui/h/h";

export const LIGHTBOX_CONTROL_IDS = ["autoplayBar", "position", "autoplay", "favorite", "download", "zoom", "fullscreen", "postPage", "close", "previous", "next"] as const;

export type LightboxControlId = typeof LIGHTBOX_CONTROL_IDS[number];

export interface LightboxControlsProps<T> {
  visibility: LightboxOverlayVisibility;
  current: Readable<T | undefined>;
  position: Readable<SequencePosition | undefined>;
  autoplay: Pick<LightboxAutoplay, "isPlaying" | "countdown">;
  zoom: Pick<LightboxZoom, "toggleDirection">;
  fullscreen: Pick<LightboxFullscreen, "isFullscreen">;
  commands: Pick<LightboxCommands, "toggleAutoplay" | "toggleZoom" | "toggleFullscreen" | "download" | "openPostPage" | "close" | "showNext" | "showPrevious">;
  favorites?: Omit<LightboxFavoriteButtonProps<T>, "current">;
  shownControls: ReadonlySet<LightboxControlId>;
}

type LightboxControlSlot = Exclude<keyof LightboxOverlayProps, "visibility">;

interface LightboxControl {
  readonly id: LightboxControlId;
  readonly slot: LightboxControlSlot;
  // eslint-disable-next-line no-restricted-syntax
  readonly render: () => HTMLElement | undefined;
}

export function LightboxControls<T>(props: LightboxControlsProps<T>): HTMLElement {
  const { autoplay, zoom, fullscreen, commands, favorites } = props;
  const controls: readonly LightboxControl[] = [
    { id: "autoplayBar", slot: "topEdge", render: () => <LightboxAutoplayBar countdown={autoplay.countdown} /> },
    { id: "position", slot: "topStart", render: () => <LightboxPosition position={props.position} /> },
    {
      id: "autoplay",
      slot: "topEnd",
      render: () => (
        <LightboxButton
          icon={computed(() => (autoplay.isPlaying.value ? "pause" : "play"))}
          label="Autoplay (Space)"
          pressed={autoplay.isPlaying}
          onClick={() => commands.toggleAutoplay()}
        />
      )
    },
    { id: "favorite", slot: "topEnd", render: () => favorites && <LightboxFavoriteButton current={props.current} {...favorites} /> },
    { id: "download", slot: "topEnd", render: () => <LightboxButton icon="download" label="Download" onClick={() => commands.download()} /> },
    {
      id: "zoom",
      slot: "topEnd",
      render: () => (
        <LightboxButton
          icon={computed(() => (zoom.toggleDirection.value === "out" ? "zoomOut" : "zoomIn"))}
          label="Zoom (Z)"
          pressed={computed(() => zoom.toggleDirection.value === "out")}
          hidden={computed(() => zoom.toggleDirection.value === undefined)}
          onClick={() => commands.toggleZoom()}
        />
      )
    },
    {
      id: "fullscreen",
      slot: "topEnd",
      render: () => (
        <LightboxButton
          icon={computed(() => (fullscreen.isFullscreen.value ? "exitFullscreen" : "fullscreen"))}
          label="Fullscreen"
          onClick={() => commands.toggleFullscreen()}
        />
      )
    },
    { id: "postPage", slot: "topEnd", render: () => <LightboxButton icon="postPage" label="Open post page" onClick={() => commands.openPostPage()} /> },
    { id: "close", slot: "topEnd", render: () => <LightboxButton icon="close" label="Close" onClick={() => commands.close()} /> },
    { id: "previous", slot: "start", render: () => <LightboxArrow direction="previous" onClick={() => commands.showPrevious()} /> },
    { id: "next", slot: "end", render: () => <LightboxArrow direction="next" onClick={() => commands.showNext()} /> }
  ];
  const renderSlot = (slot: LightboxControlSlot): (HTMLElement | undefined)[] => controls
    .filter(control => control.slot === slot && props.shownControls.has(control.id))
    .map(control => control.render());
  return (
    <LightboxOverlay
      visibility={props.visibility}
      topEdge={renderSlot("topEdge")}
      topStart={renderSlot("topStart")}
      topEnd={renderSlot("topEnd")}
      start={renderSlot("start")}
      end={renderSlot("end")}
    />
  );
}
