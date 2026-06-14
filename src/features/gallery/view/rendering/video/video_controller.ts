import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { GalleryConfig } from "@/config/gallery_config";
import { Preferences } from "@/app/context/preferences";
import { Storage } from "@/lib/storage/local_storage";
import { VideoClip } from "@/features/gallery/types/gallery_types";
import { doNothing } from "@/utils/function";
import { isVideoThumb } from "@/lib/media/type_predicates";
import { toMediaItem } from "@/lib/thumb/item";
import { videoUrl } from "@/lib/thumb/url";

const videoPlayers: HTMLVideoElement[] = [];
const videoClips = new Map();
const videoContainer: HTMLElement = document.createElement("div");
let onVideoEnded: () => void = doNothing;
let onVideoDoubleClicked: (event: MouseEvent) => void = doNothing;

videoContainer.id = "video-container-inner";

export function setup(container: HTMLElement, videoEnded: () => void, videoDoubleClicked: (event: MouseEvent) => void): void {
  onVideoEnded = videoEnded;
  onVideoDoubleClicked = videoDoubleClicked;
  insertVideoContainer(container);
  createVideoPlayers();
  preventVideoPlayersFromFlashingWhenLoaded();
  addEventListenersToVideoContainer();
  addEventListenersToVideoPlayers();
  loadVideoClips();
}

export function clearVideoSources(): void {
  for (const video of videoPlayers) {
    video.src = "";
  }
}

export function preloadVideoPlayers(thumbs: HTMLElement[]): void {
  if (videoPlayers.length === 1) {
    return;
  }
  const activeVideoPlayer = getActiveVideoPlayer();
  const inactiveVideoPlayers = getInactiveVideoPlayers();
  const videoThumbsAroundInitialThumb = thumbs
    .filter(thumb => isVideoThumb(thumb) && !videoPlayerHasSource(activeVideoPlayer, thumb))
    .slice(0, inactiveVideoPlayers.length);
  const loadedVideoSources = new Set(inactiveVideoPlayers
    .map(video => video.src)
    .filter(src => src !== ""));
  const videoSourcesAroundInitialThumb = new Set(videoThumbsAroundInitialThumb.map(thumb => videoUrl(toMediaItem(thumb))));
  const videoThumbsNotLoaded = videoThumbsAroundInitialThumb.filter(thumb => !loadedVideoSources.has(videoUrl(toMediaItem(thumb))));
  const freeInactiveVideoPlayers = inactiveVideoPlayers.filter(video => !videoSourcesAroundInitialThumb.has(video.src));

  for (let i = 0; i < freeInactiveVideoPlayers.length && i < videoThumbsNotLoaded.length; i += 1) {
    setVideoSource(freeInactiveVideoPlayers[i], videoThumbsNotLoaded[i]);
    pauseVideo(freeInactiveVideoPlayers[i]);
  }
}

export function toggleVideoLooping(value: boolean): void {
  for (const video of videoPlayers) {
    video.toggleAttribute("loop", value);
  }
}

export function toggleActiveVideoPause(): void {
  if (document.activeElement !== getActiveVideoPlayer()) {
    toggleVideoPause(getActiveVideoPlayer());
  }
}

export function restartActiveVideo(): void {
  getActiveVideoPlayer().play().catch();
}

export function playVideo(thumb: HTMLElement): Promise<void> {
  setActiveVideoPlayer(thumb);
  toggleVideoContainer(true);
  stopAllVideos();
  const video = getActiveVideoPlayer();
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = (): void => resolve();
    video.onerror = (): void => {
      video.src = "";
      reject(new Error("Video failed to load"));
    };
    setVideoSource(video, thumb);
    video.style.display = "block";
    video.play().catch(() => { });
    toggleVideoControls(true);
  });
}

export function stopAllVideos(): void {
  for (const video of videoPlayers) {
    stopVideo(video);
  }
}

export function toggleVideoMute(): void {
  getActiveVideoPlayer().muted = !getActiveVideoPlayer().muted;
  Preferences.gallery.videoMuted.set(getActiveVideoPlayer().muted);
}

function createVideoPlayer(volume: number, muted: boolean): void {
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
  videoPlayers.push(video);
  videoContainer.appendChild(video);
}

function createVideoPlayers(): void {
  const volume = Preferences.gallery.videoVolume.value;
  const muted = Preferences.gallery.videoMuted.value;

  createVideoPlayer(volume, muted);

  for (let i = 0; i < GalleryConfig.preloadedVideoCount; i += 1) {
    createVideoPlayer(volume, muted);
  }
}

function preventVideoPlayersFromFlashingWhenLoaded(): void {
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

    for (const video of videoPlayers) {
      video.setAttribute("poster", videoBackgroundUrl);
    }
  });
}

function preventDefaultBehaviorWhenControlKeyIsPressed(): void {
  videoContainer.onclick = (event): void => {
    if (!event.ctrlKey) {
      event.preventDefault();
    }
  };
}

function addEventListenersToVideoContainer(): void {
  preventDefaultBehaviorWhenControlKeyIsPressed();
}

function insertVideoContainer(container: HTMLElement): void {
  container.appendChild(videoContainer);
}

function addEventListenersToVideoPlayers(): void {
  for (const video of videoPlayers) {
    addEventListenerToVideoPlayer(video);
  }
}

function addEventListenerToVideoPlayer(video: HTMLVideoElement): void {
  revealControlsWhenMouseMoves(video);
  pauseWhenClicked(video);
  updateVolumeOfOtherVideoPlayersWhenVolumeChanges(video);
  broadcastEnding(video);
  broadcastDoubleClick(video);
  revealControlsWhenTouched(video);
}

function revealControlsWhenMouseMoves(video: HTMLVideoElement): void {
  if (ON_MOBILE_DEVICE) {
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

function pauseWhenClicked(video: HTMLVideoElement): void {
  video.addEventListener("click", (event) => {
    if (event.ctrlKey) {
      return;
    }
    toggleVideoPause(video);
  }, {
    passive: true
  });
}

function toggleVideoPause(video: HTMLVideoElement): void {
  if (video.paused) {
    video.play().catch(() => { });
  } else {
    video.pause();
  }
}

function updateVolumeOfOtherVideoPlayersWhenVolumeChanges(video: HTMLVideoElement): void {
  video.addEventListener("volumechange", (event) => {
    if (!(event.target instanceof HTMLVideoElement)) {
      return;
    }

    if (event.target === null || !event.target.hasAttribute("active")) {
      return;
    }
    Preferences.gallery.videoVolume.set(video.volume);
    Preferences.gallery.videoMuted.set(video.muted);

    for (const v of getInactiveVideoPlayers()) {
      v.volume = video.volume;
      v.muted = video.muted;
    }
  }, {
    passive: true
  });
}

function broadcastEnding(video: HTMLVideoElement): void {
  video.addEventListener("ended", () => {
    onVideoEnded();
  }, {
    passive: true
  });
}

function broadcastDoubleClick(video: HTMLVideoElement): void {
  video.addEventListener("dblclick", (event) => {
    onVideoDoubleClicked(event);
  });
}

function revealControlsWhenTouched(video: HTMLVideoElement): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  video.addEventListener("touchend", () => {
    toggleVideoControls(true);
  }, {
    passive: true
  });
}

function loadVideoClips(): void {
  setTimeout(() => {
    let storedVideoClips;

    try {
      storedVideoClips = Storage.get<typeof storedVideoClips>("storedVideoClips") ?? {};

      for (const [id, videoClip] of Object.entries(storedVideoClips)) {
        videoClips.set(id, videoClip as VideoClip);
      }
    } catch (error) {
      console.error(error);
    }
  }, 50);
}

function getActiveVideoPlayer(): HTMLVideoElement {
  return videoPlayers.find(video => video.hasAttribute("active")) || videoPlayers[0];
}

function getInactiveVideoPlayers(): HTMLVideoElement[] {
  return videoPlayers.filter(video => !video.hasAttribute("active"));
}

function stopVideo(video: HTMLVideoElement): void {
  video.style.display = "none";
  pauseVideo(video);
}

function pauseVideo(video: HTMLVideoElement): void {
  video.pause();
  video.removeAttribute("controls");
}

function videoPlayerHasSource(video: HTMLVideoElement, thumb: HTMLElement): boolean {
  return video.src === videoUrl(toMediaItem(thumb));
}

function setVideoSource(video: HTMLVideoElement, thumb: HTMLElement): void {
  if (videoPlayerHasSource(video, thumb)) {
    return;
  }
  applyVideoClip(video, thumb);
  video.src = videoUrl(toMediaItem(thumb));
}

function applyVideoClip(video: HTMLVideoElement, thumb: HTMLElement): void {
  const videoClip = videoClips.get(thumb.id);

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

function setActiveVideoPlayer(thumb: HTMLElement): void {
  for (const video of videoPlayers) {
    video.removeAttribute("active");
  }

  for (const video of videoPlayers) {
    if (videoPlayerHasSource(video, thumb)) {
      video.setAttribute("active", "");
      return;
    }
  }
  videoPlayers[0].setAttribute("active", "");
}

function toggleVideoControls(value: boolean): void {
  const video = getActiveVideoPlayer();

  if (ON_MOBILE_DEVICE) {
    if (value) {
      video.setAttribute("controls", "");
    }
  }

  if (!value) {
    video.removeAttribute("controls");
  }
}

function toggleVideoContainer(value: boolean): void {
  videoContainer.style.display = value ? "block" : "none";
}
