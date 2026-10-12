import { LightboxFavoriteButton, LightboxFavoriteButtonProps } from "@/core/ui/lightbox/controls/favorite_button/favorite_button";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { FullscreenToggle } from "@/core/ui/lightbox/screen/fullscreen_toggle";
import { LightboxArrow } from "@/core/ui/lightbox/controls/arrow/arrow";
import { LightboxAutoplay } from "@/core/ui/lightbox/autoplay/autoplay";
import { LightboxAutoplayBar } from "@/core/ui/lightbox/controls/autoplay_bar/autoplay_bar";
import { LightboxButton } from "@/core/ui/lightbox/controls/button/button";
import { LightboxOverlay } from "@/core/ui/lightbox/overlay/overlay";
import { LightboxPosition } from "@/core/ui/lightbox/controls/position/position";
import { OverlayVisibility } from "@/core/ui/lightbox/overlay/visibility";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { h } from "@/core/ui/h/h";

export interface LightboxControlsProps<T> {
  visibility: OverlayVisibility;
  current: Readable<T | undefined>;
  position: Readable<SequencePosition | undefined>;
  autoplay: Pick<LightboxAutoplay, "isPlaying" | "countdown" | "toggle">;
  fullscreen: Pick<FullscreenToggle, "isFullscreen" | "toggle">;
  favorites?: Omit<LightboxFavoriteButtonProps<T>, "current">;
  onDownload?: () => void;
  onOpenPostPage?: () => void;
  onClose: () => void;
  onShowNext: () => void;
  onShowPrevious: () => void;
}

export function LightboxControls<T>(props: LightboxControlsProps<T>): HTMLElement {
  const { autoplay, fullscreen, onDownload, onOpenPostPage } = props;
  return (
    <LightboxOverlay
      visibility={props.visibility}
      topEdge={<LightboxAutoplayBar countdown={autoplay.countdown} />}
      topStart={<LightboxPosition position={props.position} />}
      topEnd={[
        <LightboxButton
          icon={computed(() => (autoplay.isPlaying.value ? "pause" : "play"))}
          label="Autoplay (Space)"
          pressed={autoplay.isPlaying}
          onClick={() => autoplay.toggle()}
        />,
        props.favorites && <LightboxFavoriteButton current={props.current} {...props.favorites} />,
        onDownload && <LightboxButton icon="download" label="Download" onClick={onDownload} />,
        <LightboxButton
          icon={computed(() => (fullscreen.isFullscreen.value ? "exitFullscreen" : "fullscreen"))}
          label="Fullscreen"
          onClick={() => fullscreen.toggle()}
        />,
        onOpenPostPage && <LightboxButton icon="postPage" label="Open post page" onClick={onOpenPostPage} />,
        <LightboxButton icon="close" label="Close" onClick={props.onClose} />
      ]}
      start={<LightboxArrow direction="previous" onClick={props.onShowPrevious} />}
      end={<LightboxArrow direction="next" onClick={props.onShowNext} />}
    />
  );
}
