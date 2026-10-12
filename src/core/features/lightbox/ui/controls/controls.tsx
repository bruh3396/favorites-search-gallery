import { LightboxFavoriteButton, LightboxFavoriteButtonProps } from "@/core/features/lightbox/ui/controls/favorite_button/favorite_button";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { LightboxArrow } from "@/core/features/lightbox/ui/controls/arrow/arrow";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxAutoplayBar } from "@/core/features/lightbox/ui/controls/autoplay_bar/autoplay_bar";
import { LightboxButton } from "@/core/features/lightbox/ui/controls/button/button";
import { LightboxFullscreen } from "@/core/features/lightbox/ui/screen/fullscreen";
import { LightboxOverlay } from "@/core/features/lightbox/ui/overlay/overlay";
import { LightboxOverlayVisibility } from "@/core/features/lightbox/ui/overlay/visibility";
import { LightboxPosition } from "@/core/features/lightbox/ui/controls/position/position";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { h } from "@/core/ui/h/h";

export interface LightboxControlsProps<T> {
  visibility: LightboxOverlayVisibility;
  current: Readable<T | undefined>;
  position: Readable<SequencePosition | undefined>;
  autoplay: Pick<LightboxAutoplay, "isPlaying" | "countdown" | "toggle">;
  fullscreen: Pick<LightboxFullscreen, "isFullscreen" | "toggle">;
  favorites?: Omit<LightboxFavoriteButtonProps<T>, "current">;
  download?: () => void;
  openPostPage?: () => void;
  close: () => void;
  showNext: () => void;
  showPrevious: () => void;
}

export function LightboxControls<T>(props: LightboxControlsProps<T>): HTMLElement {
  const { autoplay, fullscreen, download, openPostPage } = props;
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
        download && <LightboxButton icon="download" label="Download" onClick={download} />,
        <LightboxButton
          icon={computed(() => (fullscreen.isFullscreen.value ? "exitFullscreen" : "fullscreen"))}
          label="Fullscreen"
          onClick={() => fullscreen.toggle()}
        />,
        openPostPage && <LightboxButton icon="postPage" label="Open post page" onClick={openPostPage} />,
        <LightboxButton icon="close" label="Close" onClick={props.close} />
      ]}
      start={<LightboxArrow direction="previous" onClick={props.showPrevious} />}
      end={<LightboxArrow direction="next" onClick={props.showNext} />}
    />
  );
}
