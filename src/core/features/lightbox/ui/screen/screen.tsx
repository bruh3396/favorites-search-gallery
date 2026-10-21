import { DEFAULT_LIGHTBOX_STAGE_CONFIGURATION, LightboxStage, LightboxStageDependencies } from "@/core/features/lightbox/ui/stage/stage";
import { LIGHTBOX_CONTROL_IDS, LightboxControls } from "@/core/features/lightbox/ui/controls/controls";
import { LightboxOverlayVisibility, LightboxOverlayVisibilityConfiguration } from "@/core/features/lightbox/ui/overlay/visibility";
import { LightboxZoom, ZoomPoint } from "@/core/features/lightbox/zoom/zoom";
import { Signal, computed, effect } from "@/core/utils/reactive/signal";
import { DEFAULT_LIGHTBOX_KEYMAP } from "@/core/features/lightbox/input/keymap";
import { LightboxActions } from "@/core/features/lightbox/actions/actions";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxFavoriteButtonProps } from "@/core/features/lightbox/ui/controls/favorite_button/favorite_button";
import { LightboxFullscreen } from "@/core/features/lightbox/ui/screen/fullscreen";
import { LightboxKeyboard } from "@/core/features/lightbox/input/keyboard";
import { LightboxMinimap } from "@/core/features/lightbox/ui/minimap/minimap";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { LightboxPointer } from "@/core/features/lightbox/input/pointer";
import { LightboxSession } from "@/core/features/lightbox/ui/screen/session";
import { LightboxShiftKey } from "@/core/features/lightbox/input/shift_key";
import { LightboxZoomChip } from "@/core/features/lightbox/ui/zoom_chip/zoom_chip";
import { MediaItem } from "@/core/domain/post/post";
import { Morpher } from "@/core/boundary/ports/morpher/morpher";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { createLightboxCommands } from "@/core/features/lightbox/commands/commands";
import { h } from "@/core/ui/h/h";
import { listenForVideoEnd } from "@/core/features/lightbox/input/media_events";
import { onCleanup } from "@/core/utils/reactive/scope";

export const LightboxScreenClass = {
  root: "fsg-LightboxScreen",
  content: "fsg-LightboxScreen-content"
} as const;

export interface LightboxScreenProps<T extends MediaItem> {
  navigation: Pick<LightboxNavigation<T>, "current" | "isOpen" | "neighbors" | "warmItems" | "position" | "showNext" | "showPrevious" | "close">;
  autoplay: Pick<LightboxAutoplay, "isPlaying" | "countdown" | "toggle" | "showNextAfterVideo">;
  zoom: Pick<LightboxZoom,
    "view" | "glides" | "isZoomed" | "toggleDirection" | "magnification" | "visibleRegion" | "setFrame" | "toggle" | "zoomBy" | "zoomOut" | "panBy">;
  actions: Pick<LightboxActions, "openOriginal" | "openPostPage" | "download">;
  remoteMedia: LightboxStageDependencies["remoteMedia"];
  overlay: LightboxOverlayVisibilityConfiguration;
  scheduler: Pick<Scheduler, "schedule">;
  sizeObserver: SizeObserver;
  morpher?: Morpher;
  locateItem: (item: T) => Element | undefined;
  favorites?: Omit<LightboxFavoriteButtonProps<T>, "current">;
}

export function LightboxScreen<T extends MediaItem>(props: LightboxScreenProps<T>): HTMLElement {
  const { navigation, autoplay, zoom, scheduler } = props;
  const { current } = navigation;

  const stage = new LightboxStage(DEFAULT_LIGHTBOX_STAGE_CONFIGURATION, {
    current, neighbors: navigation.neighbors, warmItems: navigation.warmItems, remoteMedia: props.remoteMedia, scheduler, sizeObserver: props.sizeObserver
  });
  const content = <div className={LightboxScreenClass.content} /> as HTMLElement;
  const visibility = new LightboxOverlayVisibility(props.overlay, scheduler);
  const fullscreen = new LightboxFullscreen(content);
  const readShownMedia = (): LightboxStage["shownMedia"] => stage.shownMedia;

  const commands = createLightboxCommands({
    navigation, autoplay, zoom, actions: props.actions, fullscreen, stage, morpher: props.morpher, locateItem: props.locateItem
  });

  const pointer = new LightboxPointer({ commands, isZoomed: zoom.isZoomed, visibility, locatePoint: (event): ZoomPoint => locatePoint(content, event) });
  const shiftKey = new LightboxShiftKey(content.ownerDocument);
  const dialog = (
    <dialog
      className={LightboxScreenClass.root}
      dataset={{
        idle: computed(() => String(!visibility.shown.value)),
        zoomed: computed(() => String(zoom.isZoomed.value)),
        zoomCursor: computed(() => (shiftKey.isHeld.value ? zoom.toggleDirection.value ?? "none" : "none"))
      }}
      aria-label="Gallery"
      autofocus
      tabIndex={-1}
      onCancel={(event): void => {
        event.preventDefault();
        (zoom.isZoomed.peek() ? commands.zoomOut : commands.close)();
      }}
      onClose={(): void => {
        if (!dialog.open && current.peek() !== undefined) {
          navigation.close();
        }
      }}
      {...pointer.listeners}
    >
      {content}
    </dialog>
  ) as HTMLDialogElement;
  const keyboard = new LightboxKeyboard({ dialog, commands, keymap: new Signal(DEFAULT_LIGHTBOX_KEYMAP), lastPoint: pointer.lastPoint });
  const session = new LightboxSession({
    isOpen: navigation.isOpen,
    parts: [
      keyboard,
      shiftKey,
      pointer,
      visibility,
      fullscreen,
      { start: (): void => openModal(dialog), stop: (): void => dialog.close() }
    ]
  });

  effect(() => zoom.setFrame(stage.frame.value));
  effect(() => stage.showZoomView(zoom.view.value, zoom.glides.peek()));
  listenForVideoEnd(content, { readShownMedia, autoplay });

  content.append(
    stage.root,
    <LightboxControls
      visibility={visibility}
      current={current}
      position={navigation.position}
      autoplay={autoplay}
      zoom={zoom}
      fullscreen={fullscreen}
      commands={commands}
      favorites={props.favorites}
      shownControls={new Set(LIGHTBOX_CONTROL_IDS)}
    />,
    <LightboxZoomChip magnification={zoom.magnification} />,
    <LightboxMinimap region={zoom.visibleRegion} readShownMedia={readShownMedia} />
  );
  onCleanup(() => {
    session.dispose();
    stage.dispose();
  });
  return dialog;
}

function locatePoint(element: Element, event: MouseEvent): ZoomPoint {
  const box = element.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

function openModal(dialog: HTMLDialogElement): void {
  dialog.showModal();
  dialog.focus({ preventScroll: true });
}
