import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../../../../../lib/global/flags/intrinsic_flags";
import { Events } from "../../../../../lib/global/events/events";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { Preferences } from "../../../../../lib/global/preferences/preferences";
import { VideoClip } from "../../../types/gallery_types";
import { convertPreviewURLToImageURL } from "../../../../../utils/content/image_url";
import { getPreviewURL } from "../../../../../utils/dom/dom";
import { isVideo } from "../../../../../utils/content/content_type";

const VIDEO_PLAYERS: HTMLVideoElement[] = [];
const VIDEO_CLIPS = new Map();
const VIDEO_CONTAINER: HTMLElement = document.createElement("div");

VIDEO_CONTAINER.id = "video-container-inner";

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
  VIDEO_PLAYERS.push(video);
  VIDEO_CONTAINER.appendChild(video);
}

function createVideoPlayers(): void {
  const volume = Preferences.videoVolume.value;
  const muted = Preferences.videoMuted.value;

  createVideoPlayer(volume, muted);

  for (let i = 0; i < GallerySettings.preloadedVideoCount; i += 1) {
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
    const videoBackgroundURL = URL.createObjectURL(blob);

    for (const video of VIDEO_PLAYERS) {
      video.setAttribute("poster", videoBackgroundURL);
    }
  });
}

function preventDefaultBehaviorWhenControlKeyIsPressed(): void {
  VIDEO_CONTAINER.onclick = (event): void => {
    if (!event.ctrlKey) {
      event.preventDefault();
    }
  };
}

function addEventListenersToVideoContainer(): void {
  preventDefaultBehaviorWhenControlKeyIsPressed();
}

function insertVideoContainer(container: HTMLElement): void {
  container.appendChild(VIDEO_CONTAINER);
}

export function setupVideoController(container: HTMLElement): void {
  insertVideoContainer(container);
  createVideoPlayers();
  preventVideoPlayersFromFlashingWhenLoaded();
  addEventListenersToVideoContainer();
  addEventListenersToVideoPlayers();
  loadVideoClips();
}

function addEventListenersToVideoPlayers(): void {
  for (const video of VIDEO_PLAYERS) {
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

export function toggleVideoMute(): void {
  getActiveVideoPlayer().muted = !getActiveVideoPlayer().muted;
  Preferences.videoMuted.set(getActiveVideoPlayer().muted);
}

function updateVolumeOfOtherVideoPlayersWhenVolumeChanges(video: HTMLVideoElement): void {
  video.addEventListener("volumechange", (event) => {
    if (!(event.target instanceof HTMLVideoElement)) {
      return;
    }

    if (event.target === null || !event.target.hasAttribute("active")) {
      return;
    }
    Preferences.videoVolume.set(video.volume);
    Preferences.videoMuted.set(video.muted);

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
    Events.gallery.videoEnded.emit();
  }, {
    passive: true
  });
}

function broadcastDoubleClick(video: HTMLVideoElement): void {
  video.addEventListener("dblclick", (event) => {
    Events.gallery.videoDoubleClicked.emit(event);
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
      storedVideoClips = JSON.parse(localStorage.getItem("storedVideoClips") || "{}");

      for (const [id, videoClip] of Object.entries(storedVideoClips)) {
        VIDEO_CLIPS.set(id, videoClip as VideoClip);
      }
    } catch (error) {
      console.error(error);
    }
  }, 50);
}

function getActiveVideoPlayer(): HTMLVideoElement {
  return VIDEO_PLAYERS.find(video => video.hasAttribute("active")) || VIDEO_PLAYERS[0];
}

function getInactiveVideoPlayers(): HTMLVideoElement[] {
  return VIDEO_PLAYERS.filter(video => !video.hasAttribute("active"));
}

export function playVideo(thumb: HTMLElement): void {
  setActiveVideoPlayer(thumb);
  toggleVideoContainer(true);
  stopAllVideos();
  const video = getActiveVideoPlayer();

  setVideoSource(video, thumb);
  video.style.display = "block";
  video.play().catch(() => { });
  toggleVideoControls(true);
}

export function stopAllVideos(): void {
  for (const video of VIDEO_PLAYERS) {
    stopVideo(video);
  }
}

function stopVideo(video: HTMLVideoElement): void {
  video.style.display = "none";
  pauseVideo(video);
}

function pauseVideo(video: HTMLVideoElement): void {
  video.pause();
  video.removeAttribute("controls");
}

export function preloadVideoPlayers(thumbs: HTMLElement[]): void {
  const activeVideoPlayer = getActiveVideoPlayer();
  const inactiveVideoPlayers = getInactiveVideoPlayers();
  const videoThumbsAroundInitialThumb = thumbs
    .filter(thumb => isVideo(thumb) && !videoPlayerHasSource(activeVideoPlayer, thumb))
    .slice(0, inactiveVideoPlayers.length);
  const loadedVideoSources = new Set(inactiveVideoPlayers
    .map(video => video.src)
    .filter(src => src !== ""));
  const videoSourcesAroundInitialThumb = new Set(videoThumbsAroundInitialThumb.map(thumb => getVideoSource(thumb)));
  const videoThumbsNotLoaded = videoThumbsAroundInitialThumb.filter(thumb => !loadedVideoSources.has(getVideoSource(thumb)));
  const freeInactiveVideoPlayers = inactiveVideoPlayers.filter(video => !videoSourcesAroundInitialThumb.has(video.src));

  for (let i = 0; i < freeInactiveVideoPlayers.length && i < videoThumbsNotLoaded.length; i += 1) {
    // await sleep(10);
    // await waitForVideoToLoad(getActiveVideoPlayer());
    // await sleep(10);
    setVideoSource(freeInactiveVideoPlayers[i], videoThumbsNotLoaded[i]);
    pauseVideo(freeInactiveVideoPlayers[i]);
  }
}

function videoPlayerHasSource(video: HTMLVideoElement, thumb: HTMLElement): boolean {
  return video.src === getVideoSource(thumb);
}

function getVideoSource(thumb: HTMLElement): string {
  return convertPreviewURLToImageURL(getPreviewURL(thumb) ?? "").replace("jpg", "mp4");
}

function setVideoSource(video: HTMLVideoElement, thumb: HTMLElement): void {
  if (videoPlayerHasSource(video, thumb)) {
    return;
  }
  createVideoClip(video, thumb);
  video.src = getVideoSource(thumb);
}

function createVideoClip(video: HTMLVideoElement, thumb: HTMLElement): void {
  const videoClip = VIDEO_CLIPS.get(thumb.id);

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
  for (const video of VIDEO_PLAYERS) {
    video.removeAttribute("active");
  }

  for (const video of VIDEO_PLAYERS) {
    if (videoPlayerHasSource(video, thumb)) {
      video.setAttribute("active", "");
      return;
    }
  }
  VIDEO_PLAYERS[0].setAttribute("active", "");
}

function toggleVideoControls(value: boolean): void {
  const video = getActiveVideoPlayer();

  if (ON_MOBILE_DEVICE) {
    if (value) {
      video.setAttribute("controls", "");
    }
  } else {
    // video.style.pointerEvents = value ? "auto" : "none";
  }

  if (!value) {
    video.removeAttribute("controls");
  }
}

export function clearInactiveVideoSources(): void {
  const inactivePlayers = getInactiveVideoPlayers();

  for (const video of inactivePlayers) {
    video.src = "";
  }
}

export function clearVideoSources(): void {
  for (const video of VIDEO_PLAYERS) {
    video.src = "";
  }
}

export function toggleVideoLooping(value: boolean): void {
  for (const video of VIDEO_PLAYERS) {
    video.toggleAttribute("loop", value);
  }
}

function toggleVideoContainer(value: boolean): void {
  VIDEO_CONTAINER.style.display = value ? "block" : "none";
}

export function toggleActiveVideoPause(): void {
  if (document.activeElement !== getActiveVideoPlayer()) {
    toggleVideoPause(getActiveVideoPlayer());
  }
}

export function restartActiveVideo(): void {
  getActiveVideoPlayer().play().catch();
}
