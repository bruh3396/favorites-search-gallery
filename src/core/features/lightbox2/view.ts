import { LightboxActions } from "@/core/features/lightbox2/actions";
import { LightboxCommands } from "@/core/features/lightbox2/commands";
import { LightboxDialog } from "@/core/features/lightbox2/ui/dialog";
import { LightboxFullscreen } from "@/core/features/lightbox2/fullscreen";
import { LightboxKeymap, createLightboxKeyListener } from "@/core/features/lightbox2/keymap";
import { LightboxNavigation } from "@/core/features/lightbox2/navigation";
import { LightboxOverlayVisibility } from "@/core/features/lightbox2/overlay_visibility";
import { LightboxStage } from "@/core/features/lightbox2/stage";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { currentDocument, h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

const GIF_CAPACITY = 3;
const VIDEO_CAPACITY = 5;
const OVERLAY_IDLE_DELAY = 2_000;
const OVERLAY_LEAVE_DELAY = 1_000;

export interface LightboxViewConfiguration {
  readonly keymap: LightboxKeymap;
}

export interface LightboxViewDependencies<T extends MediaItem> {
  scheduler: Pick<Scheduler, "schedule">;
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  actions: LightboxActions;
  navigation: Pick<LightboxNavigation<T>, "isOpen" | "currentItem" | "position" | "goToNext" | "goToPrevious" | "close">;
  retainedItems: Readable<readonly T[]>;
  volume: Preference<number>;
  muted: Preference<boolean>;
}

export function createLightboxView<T extends MediaItem>(
  configuration: LightboxViewConfiguration,
  dependencies: LightboxViewDependencies<T>
): HTMLElement {
  const { scheduler, remoteMedia, actions, navigation, retainedItems, volume, muted } = dependencies;
  const stage = new LightboxStage<T>(
    { gifCapacity: GIF_CAPACITY, videoCapacity: VIDEO_CAPACITY },
    { remoteMedia, currentItem: navigation.currentItem, retainedItems, volume, muted }
  );
  const overlayVisibility = new LightboxOverlayVisibility({ idleDelay: OVERLAY_IDLE_DELAY, leaveDelay: OVERLAY_LEAVE_DELAY }, scheduler);
  const fullscreen = new LightboxFullscreen(currentDocument());
  const commands = bindLightboxCommands({ navigation, stage, fullscreen, actions });

  onCleanup(() => overlayVisibility.dispose());
  effect(() => {
    if (!navigation.isOpen.value) {
      fullscreen.exit();
    }
  });
  return h(LightboxDialog, {
    isOpen: navigation.isOpen,
    currentItem: navigation.currentItem,
    position: navigation.position,
    stage,
    overlayVisibility,
    inFullscreen: fullscreen.inFullscreen,
    commands,
    onKeyDown: createLightboxKeyListener(configuration.keymap, commands),
    resolvePreviewUrl: (media: Media): Promise<string> => remoteMedia.resolvePreviewUrl(media)
  });
}

interface CommandTargets<T extends MediaItem> {
  navigation: Pick<LightboxNavigation<T>, "currentItem" | "goToNext" | "goToPrevious" | "close">;
  stage: Pick<LightboxStage<T>, "togglePause" | "toggleMute">;
  fullscreen: Pick<LightboxFullscreen, "toggle">;
  actions: LightboxActions;
}

function bindLightboxCommands<T extends MediaItem>(targets: CommandTargets<T>): LightboxCommands {
  const { navigation, stage, fullscreen, actions } = targets;
  const withCurrentItem = (run: (item: T) => void) => (): void => {
    const item = navigation.currentItem.peek();

    if (item !== undefined) {
      run(item);
    }
  };
  return {
    showNext: (): void => {
      navigation.goToNext().catch(console.error);
    },
    showPrevious: (): void => {
      navigation.goToPrevious().catch(console.error);
    },
    togglePause: (): void => stage.togglePause(),
    toggleMute: (): void => stage.toggleMute(),
    toggleFullscreen: (): void => fullscreen.toggle(),
    download: withCurrentItem(item => actions.download(item)),
    openPostPage: withCurrentItem(item => actions.openPostPage(item)),
    close: (): void => navigation.close()
  };
}
