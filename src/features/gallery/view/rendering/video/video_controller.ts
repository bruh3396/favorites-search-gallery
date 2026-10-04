import { PostMedia } from "@/core/domain/post/post";
import { Preferences } from "@/app/context/preferences";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { VideoClip } from "@/features/gallery/types/types";
import { doNothing } from "@/utils/pure/function";
import { isVideo } from "@/lib/media/media_type";

export interface GalleryVideoControllerConfiguration {
  preloadedVideoCount: number;
  allowsNativeControls: boolean;
}

export interface GalleryVideoControllerDependencies {
  preferences: Preferences;
  remoteMedia: Pick<RemoteMedia, "resolveOriginalUrl">;
}

export class GalleryVideoController {
  private readonly configuration: GalleryVideoControllerConfiguration;
  private readonly preferences: Preferences;
  private readonly remoteMedia: Pick<RemoteMedia, "resolveOriginalUrl">;
  private readonly videoPlayers: HTMLVideoElement[] = [];
  // Empty until the clip feature lands; it will load clips (stored under
  // "storedVideoClips") through the LocalKeyedValues port.
  private readonly videoClips = new Map<string, VideoClip>();
  private readonly videoContainer: HTMLElement = document.createElement("div");
  private onVideoEnded: () => void = doNothing;
  private onVolumeChanged: (volume: number) => void = doNothing;

  constructor(configuration: GalleryVideoControllerConfiguration, dependencies: GalleryVideoControllerDependencies) {
    this.configuration = configuration;
    this.preferences = dependencies.preferences;
    this.remoteMedia = dependencies.remoteMedia;
    this.videoContainer.id = "video-container-inner";
  }

  public setup(container: HTMLElement, videoEnded: () => void, volumeChanged: (volume: number) => void): void {
    this.onVideoEnded = videoEnded;
    this.onVolumeChanged = volumeChanged;
    this.insertVideoContainer(container);
    this.createVideoPlayers();
    this.preventVideoPlayersFromFlashingWhenLoaded();
    this.addEventListenersToVideoPlayers();
  }

  public clearVideoSources(): void {
    for (const video of this.videoPlayers) {
      this.clearVideoSource(video);
    }
  }

  public preloadVideoPlayers(items: PostMedia[]): void {
    if (this.videoPlayers.length === 1) {
      return;
    }
    const activeVideoPlayer = this.getActiveVideoPlayer();
    const inactiveVideoPlayers = this.getInactiveVideoPlayers();
    const videoItemsAroundInitialItem = items
      .filter(item => isVideo(item) && !this.videoPlayerHasSource(activeVideoPlayer, item))
      .slice(0, inactiveVideoPlayers.length);
    const loadedIds = new Set(inactiveVideoPlayers.map(video => video.dataset.id));
    const idsAroundInitialItem = new Set(videoItemsAroundInitialItem.map(item => item.id));
    const videoItemsNotLoaded = videoItemsAroundInitialItem.filter(item => !loadedIds.has(item.id));
    const freeInactiveVideoPlayers = inactiveVideoPlayers.filter(video => video.dataset.id === undefined || !idsAroundInitialItem.has(video.dataset.id));

    for (let i = 0; i < freeInactiveVideoPlayers.length && i < videoItemsNotLoaded.length; i += 1) {
      this.preloadVideo(freeInactiveVideoPlayers[i], videoItemsNotLoaded[i]);
    }
  }

  public toggleVideoLooping(value: boolean): void {
    for (const video of this.videoPlayers) {
      video.toggleAttribute("loop", value);
    }
  }

  public toggleActiveVideoPause(): void {
    this.toggleVideoPause(this.getActiveVideoPlayer());
  }

  public showActiveVideoControls(): void {
    this.getActiveVideoPlayer().setAttribute("controls", "");
  }

  public isActiveVideoFocused(): boolean {
    return document.activeElement === this.getActiveVideoPlayer();
  }

  public restartActiveVideo(): void {
    this.getActiveVideoPlayer().play().catch();
  }

  public playVideo(item: PostMedia): Promise<void> {
    this.setActiveVideoPlayer(item);
    this.toggleVideoContainer(true);
    this.stopAllVideos();
    const video = this.getActiveVideoPlayer();
    return new Promise((resolve, reject) => {
      video.onloadedmetadata = (): void => resolve();
      video.onerror = (): void => {
        this.clearVideoSource(video);
        reject(new Error("Video failed to load"));
      };
      video.style.display = "block";
      this.toggleVideoControls(true);
      this.setVideoSource(video, item).then(holdsItem => {
        if (holdsItem) {
          video.play().catch(doNothing);
        }
      });
    });
  }

  public stopAllVideos(): void {
    for (const video of this.videoPlayers) {
      this.stopVideo(video);
    }
  }

  public setVideoMuted(muted: boolean): void {
    for (const video of this.videoPlayers) {
      video.muted = muted;
    }
  }

  private createVideoPlayer(volume: number, muted: boolean): void {
    const video = document.createElement("video");

    video.setAttribute("width", "100%");
    video.setAttribute("height", "100%");
    video.autoplay = true;
    video.volume = volume;
    video.muted = muted;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("controlsList", "nofullscreen");
    video.setAttribute("webkit-playsinline", "");
    this.videoPlayers.push(video);
    this.videoContainer.appendChild(video);
  }

  private createVideoPlayers(): void {
    const volume = this.preferences.gallery.videoVolume.value;
    const isMuted = this.preferences.gallery.videoMuted.value;

    this.createVideoPlayer(volume, isMuted);

    for (let i = 0; i < this.configuration.preloadedVideoCount; i += 1) {
      this.createVideoPlayer(volume, isMuted);
    }
  }

  private preventVideoPlayersFromFlashingWhenLoaded(): void {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context !== null) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.toBlob(blob => {
      if (blob === null) {
        return;
      }
      const videoBackgroundUrl = URL.createObjectURL(blob);

      for (const video of this.videoPlayers) {
        video.setAttribute("poster", videoBackgroundUrl);
      }
    });
  }

  private insertVideoContainer(container: HTMLElement): void {
    container.appendChild(this.videoContainer);
  }

  private addEventListenersToVideoPlayers(): void {
    for (const video of this.videoPlayers) {
      this.addEventListenerToVideoPlayer(video);
    }
  }

  private addEventListenerToVideoPlayer(video: HTMLVideoElement): void {
    this.updateVolumeOfOtherVideoPlayersWhenVolumeChanges(video);
    this.broadcastEnding(video);
  }

  private toggleVideoPause(video: HTMLVideoElement): void {
    if (video.paused) {
      video.play().catch(() => { });
    } else {
      video.pause();
    }
  }

  private updateVolumeOfOtherVideoPlayersWhenVolumeChanges(video: HTMLVideoElement): void {
    video.addEventListener("volumechange", event => {
      if (!(event.target instanceof HTMLVideoElement)) {
        return;
      }

      if (event.target === null || !event.target.hasAttribute("active")) {
        return;
      }
      this.onVolumeChanged(video.volume);

      for (const v of this.getInactiveVideoPlayers()) {
        v.volume = video.volume;
        v.muted = video.muted;
      }
    }, {
      passive: true
    });
  }

  private broadcastEnding(video: HTMLVideoElement): void {
    video.addEventListener("ended", () => {
      this.onVideoEnded();
    }, {
      passive: true
    });
  }

  private getActiveVideoPlayer(): HTMLVideoElement {
    return this.videoPlayers.find(video => video.hasAttribute("active")) || this.videoPlayers[0];
  }

  private getInactiveVideoPlayers(): HTMLVideoElement[] {
    return this.videoPlayers.filter(video => !video.hasAttribute("active"));
  }

  private stopVideo(video: HTMLVideoElement): void {
    video.style.display = "none";
    this.pauseVideo(video);
  }

  private pauseVideo(video: HTMLVideoElement): void {
    video.pause();
    video.removeAttribute("controls");
  }

  private videoPlayerHasSource(video: HTMLVideoElement, item: PostMedia): boolean {
    return video.dataset.id === item.id;
  }

  private async preloadVideo(video: HTMLVideoElement, item: PostMedia): Promise<void> {
    if (await this.setVideoSource(video, item)) {
      this.pauseVideo(video);
    }
  }

  private async setVideoSource(video: HTMLVideoElement, item: PostMedia): Promise<boolean> {
    if (this.videoPlayerHasSource(video, item)) {
      return true;
    }
    video.dataset.id = item.id;
    this.applyVideoClip(video, item);
    const url = await this.remoteMedia.resolveOriginalUrl(item.media);

    if (!this.videoPlayerHasSource(video, item)) {
      return false;
    }
    video.src = url;
    return true;
  }

  private clearVideoSource(video: HTMLVideoElement): void {
    delete video.dataset.id;
    video.src = "";
  }

  private applyVideoClip(video: HTMLVideoElement, item: PostMedia): void {
    const videoClip = this.videoClips.get(item.id);

    if (videoClip === undefined) {
      video.ontimeupdate = null;
      return;
    }
    video.ontimeupdate = (): void => {
      if (video.currentTime < videoClip.start || video.currentTime > videoClip.end) {
        video.removeAttribute("controls");
        video.currentTime = videoClip.start;
      }
    };
  }

  private setActiveVideoPlayer(item: PostMedia): void {
    for (const video of this.videoPlayers) {
      video.removeAttribute("active");
    }

    for (const video of this.videoPlayers) {
      if (this.videoPlayerHasSource(video, item)) {
        video.setAttribute("active", "");
        return;
      }
    }
    this.videoPlayers[0].setAttribute("active", "");
  }

  private toggleVideoControls(value: boolean): void {
    const video = this.getActiveVideoPlayer();

    if (this.configuration.allowsNativeControls) {
      if (value) {
        video.setAttribute("controls", "");
      }
    }

    if (!value) {
      video.removeAttribute("controls");
    }
  }

  private toggleVideoContainer(value: boolean): void {
    this.videoContainer.style.display = value ? "block" : "none";
  }
}
