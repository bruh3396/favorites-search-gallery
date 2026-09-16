import { isVideoThumb, toMediaItem } from "@/lib/ui/thumb/media_item";
import { Environment } from "@/app/context/environment";
import { GalleryConfig } from "@/config/gallery_config";
import { Preferences } from "@/app/context/preferences";
import { Storage } from "@/lib/storage/local_storage";
import { VideoClip } from "@/features/gallery/types/types";
import { doNothing } from "@/utils/pure/function";
import { videoUrl } from "@/lib/media/url";

export class GalleryVideoController {
  private readonly environment: Environment;
  private readonly preferences: Preferences;
  private readonly videoPlayers: HTMLVideoElement[] = [];
  private readonly videoClips = new Map();
  private readonly videoContainer: HTMLElement = document.createElement("div");
  private onVideoEnded: () => void = doNothing;
  private onVideoDoubleClicked: (event: MouseEvent) => void = doNothing;
  private onVolumeChanged: (volume: number) => void = doNothing;

  constructor(preferences: Preferences, environment: Environment) {
    this.preferences = preferences;
    this.environment = environment;
    this.videoContainer.id = "video-container-inner";
  }

  public setup(container: HTMLElement, videoEnded: () => void, videoDoubleClicked: (event: MouseEvent) => void, volumeChanged: (volume: number) => void): void {
    this.onVideoEnded = videoEnded;
    this.onVideoDoubleClicked = videoDoubleClicked;
    this.onVolumeChanged = volumeChanged;
    this.insertVideoContainer(container);
    this.createVideoPlayers();
    this.preventVideoPlayersFromFlashingWhenLoaded();
    this.addEventListenersToVideoContainer();
    this.addEventListenersToVideoPlayers();
    this.loadVideoClips();
  }

  public clearVideoSources(): void {
    for (const video of this.videoPlayers) {
      video.src = "";
    }
  }

  public preloadVideoPlayers(thumbs: HTMLElement[]): void {
    if (this.videoPlayers.length === 1) {
      return;
    }
    const activeVideoPlayer = this.getActiveVideoPlayer();
    const inactiveVideoPlayers = this.getInactiveVideoPlayers();
    const videoThumbsAroundInitialThumb = thumbs
      .filter(thumb => isVideoThumb(thumb) && !this.videoPlayerHasSource(activeVideoPlayer, thumb))
      .slice(0, inactiveVideoPlayers.length);
    const loadedVideoSources = new Set(inactiveVideoPlayers
      .map(video => video.src)
      .filter(src => src !== ""));
    const videoSourcesAroundInitialThumb = new Set(videoThumbsAroundInitialThumb.map(thumb => videoUrl(toMediaItem(thumb))));
    const videoThumbsNotLoaded = videoThumbsAroundInitialThumb.filter(thumb => !loadedVideoSources.has(videoUrl(toMediaItem(thumb))));
    const freeInactiveVideoPlayers = inactiveVideoPlayers.filter(video => !videoSourcesAroundInitialThumb.has(video.src));

    for (let i = 0; i < freeInactiveVideoPlayers.length && i < videoThumbsNotLoaded.length; i += 1) {
      this.setVideoSource(freeInactiveVideoPlayers[i], videoThumbsNotLoaded[i]);
      this.pauseVideo(freeInactiveVideoPlayers[i]);
    }
  }

  public toggleVideoLooping(value: boolean): void {
    for (const video of this.videoPlayers) {
      video.toggleAttribute("loop", value);
    }
  }

  public toggleActiveVideoPause(): void {
    if (document.activeElement !== this.getActiveVideoPlayer()) {
      this.toggleVideoPause(this.getActiveVideoPlayer());
    }
  }

  public restartActiveVideo(): void {
    this.getActiveVideoPlayer().play().catch();
  }

  public playVideo(thumb: HTMLElement): Promise<void> {
    this.setActiveVideoPlayer(thumb);
    this.toggleVideoContainer(true);
    this.stopAllVideos();
    const video = this.getActiveVideoPlayer();
    return new Promise((resolve, reject) => {
      video.onloadedmetadata = (): void => resolve();
      video.onerror = (): void => {
        video.src = "";
        reject(new Error("Video failed to load"));
      };
      this.setVideoSource(video, thumb);
      video.style.display = "block";
      video.play().catch(() => { });
      this.toggleVideoControls(true);
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

    const preloadedVideoCount = this.environment.onMobileDevice ? GalleryConfig.preloadedVideoCount.mobile : GalleryConfig.preloadedVideoCount.desktop;

    for (let i = 0; i < preloadedVideoCount; i += 1) {
      this.createVideoPlayer(volume, isMuted);
    }
  }

  private preventVideoPlayersFromFlashingWhenLoaded(): void {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context !== null) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.toBlob((blob) => {
      if (blob === null) {
        return;
      }
      const videoBackgroundUrl = URL.createObjectURL(blob);

      for (const video of this.videoPlayers) {
        video.setAttribute("poster", videoBackgroundUrl);
      }
    });
  }

  private preventDefaultBehaviorWhenControlKeyIsPressed(): void {
    this.videoContainer.onclick = (event): void => {
      if (!event.ctrlKey) {
        event.preventDefault();
      }
    };
  }

  private addEventListenersToVideoContainer(): void {
    this.preventDefaultBehaviorWhenControlKeyIsPressed();
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
    this.revealControlsWhenMouseMoves(video);
    this.pauseWhenClicked(video);
    this.updateVolumeOfOtherVideoPlayersWhenVolumeChanges(video);
    this.broadcastEnding(video);
    this.broadcastDoubleClick(video);
    this.revealControlsWhenTouched(video);
  }

  private revealControlsWhenMouseMoves(video: HTMLVideoElement): void {
    if (this.environment.onMobileDevice) {
      return;
    }
    video.addEventListener("mousemove", () => {
      if (!video.hasAttribute("controls")) {
        video.setAttribute("controls", "");
      }
    }, {
      passive: true
    });
  }

  private pauseWhenClicked(video: HTMLVideoElement): void {
    video.addEventListener("click", (event) => {
      if (event.ctrlKey) {
        return;
      }
      this.toggleVideoPause(video);
    }, {
      passive: true
    });
  }

  private toggleVideoPause(video: HTMLVideoElement): void {
    if (video.paused) {
      video.play().catch(() => { });
    } else {
      video.pause();
    }
  }

  private updateVolumeOfOtherVideoPlayersWhenVolumeChanges(video: HTMLVideoElement): void {
    video.addEventListener("volumechange", (event) => {
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

  private broadcastDoubleClick(video: HTMLVideoElement): void {
    video.addEventListener("dblclick", (event) => {
      this.onVideoDoubleClicked(event);
    });
  }

  private revealControlsWhenTouched(video: HTMLVideoElement): void {
    if (this.environment.onDesktopDevice) {
      return;
    }
    video.addEventListener("touchend", () => {
      this.toggleVideoControls(true);
    }, {
      passive: true
    });
  }

  private loadVideoClips(): void {
    setTimeout(() => {
      let storedVideoClips;

      try {
        storedVideoClips = Storage.get<typeof storedVideoClips>("storedVideoClips") ?? {};

        for (const [id, videoClip] of Object.entries(storedVideoClips)) {
          this.videoClips.set(id, videoClip as VideoClip);
        }
      } catch (error) {
        console.error(error);
      }
    }, 50);
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

  private videoPlayerHasSource(video: HTMLVideoElement, thumb: HTMLElement): boolean {
    return video.src === videoUrl(toMediaItem(thumb));
  }

  private setVideoSource(video: HTMLVideoElement, thumb: HTMLElement): void {
    if (this.videoPlayerHasSource(video, thumb)) {
      return;
    }
    this.applyVideoClip(video, thumb);
    video.src = videoUrl(toMediaItem(thumb));
  }

  private applyVideoClip(video: HTMLVideoElement, thumb: HTMLElement): void {
    const videoClip = this.videoClips.get(thumb.id);

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

  private setActiveVideoPlayer(thumb: HTMLElement): void {
    for (const video of this.videoPlayers) {
      video.removeAttribute("active");
    }

    for (const video of this.videoPlayers) {
      if (this.videoPlayerHasSource(video, thumb)) {
        video.setAttribute("active", "");
        return;
      }
    }
    this.videoPlayers[0].setAttribute("active", "");
  }

  private toggleVideoControls(value: boolean): void {
    const video = this.getActiveVideoPlayer();

    if (this.environment.onMobileDevice) {
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
