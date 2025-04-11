class VideoController {
  static commonVideoAttributes = "width=\"100%\" height=\"100%\" autoplay muted loop controlsList=\"nofullscreen\" webkit-playsinline playsinline";

  /** @type {HTMLElement} */
  videoContainer;
  /** @type {HTMLVideoElement[]} */
  videoPlayers;
  /** @type {Map<String, VideoClip>} */
  videoClips;

  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this.videoClips = new Map();
    this.createVideoContainer(container);
    this.createVideoPlayers();
    this.preventVideoPlayersFromFlashingWhenLoaded();
    this.addEventListenersToVideoContainer();
    this.addEventListenersToVideoPlayers();
    this.loadVideoClips();
  }

  /**
   * @param {HTMLElement} container
   */
  createVideoContainer(container) {
    this.videoContainer = document.createElement("div");
    container.id = "video-container";
    container.appendChild(this.videoContainer);
  }

  createVideoPlayers() {
    this.videoPlayers = [];
    const volume = Preferences.videoVolume.value;
    const muted = Preferences.videoMuted.value;

    this.createVideoPlayer(volume, muted);

    for (let i = 0; i < GallerySettings.preloadedVideoCount; i += 1) {
      this.createVideoPlayer(volume, muted);
    }
  }

  /**
   * @param {Number} volume
   * @param {Boolean} muted
   */
  createVideoPlayer(volume, muted) {
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

  preventVideoPlayersFromFlashingWhenLoaded() {
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

      for (const video of this.videoPlayers) {
        video.setAttribute("poster", videoBackgroundURL);
      }
    });
  }

  addEventListenersToVideoContainer() {
    this.preventDefaultBehaviorWhenControlKeyIsPressed();
  }

  addEventListenersToVideoPlayers() {
    for (const video of this.videoPlayers) {
      this.addEventListenerToVideoPlayer(video);
    }
  }

  /**
   * @param {HTMLVideoElement} video
   */
  addEventListenerToVideoPlayer(video) {
    this.revealControlsWhenMouseMoves(video);
    this.pauseWhenClicked(video);
    this.updateVolumeOfOtherVideoPlayersWhenVolumeChanges(video);
    this.broadcastEnding(video);
    this.broadcastDoubleClick(video);
    this.revealControlsWhenTouched(video);
  }

  preventDefaultBehaviorWhenControlKeyIsPressed() {
    if (this.videoContainer === null) {
      return;
    }
    this.videoContainer.onclick = (event) => {
      if (!event.ctrlKey) {
        event.preventDefault();
      }
    };
  }

  /**
   * @param {HTMLVideoElement} video
   */
  revealControlsWhenMouseMoves(video) {
    if (Flags.onMobileDevice) {
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

  /**
   * @param {HTMLVideoElement} video
   */
  pauseWhenClicked(video) {
    video.addEventListener("click", (event) => {
      if (event.ctrlKey) {
        return;
      }
      this.toggleVideoPause(video);
    }, {
      passive: true
    });
  }

  /**
   * @param {HTMLVideoElement} video
   */
  toggleVideoPause(video) {
    if (video.paused) {
      video.play().catch(() => { });
    } else {
      video.pause();
    }
  }

  /**
   * @param {HTMLVideoElement} video
   */
  updateVolumeOfOtherVideoPlayersWhenVolumeChanges(video) {
    video.addEventListener("volumechange", (event) => {
      if (!(event.target instanceof HTMLVideoElement)) {
        return;
      }

      if (event.target === null || !event.target.hasAttribute("active")) {
        return;
      }
      Preferences.videoVolume.set(video.volume);
      Preferences.videoMuted.set(video.muted);

      for (const v of this.getInactiveVideoPlayers()) {
        v.volume = video.volume;
        v.muted = video.muted;
      }
    }, {
      passive: true
    });
  }

  /**
   * @param {HTMLVideoElement} video
   */
  broadcastEnding(video) {
    video.addEventListener("ended", () => {
      dispatchEvent(new Event("videoEnded"));
    }, {
      passive: true
    });
  }

  /**
   * @param {HTMLVideoElement} video
   */
  broadcastDoubleClick(video) {
    video.addEventListener("dblclick", () => {
      video.dispatchEvent(new CustomEvent("galleryController", {
        detail: "exitGallery",
        bubbles: true
      }));
    });
  }

  /**
   * @param {HTMLVideoElement} video
   */
  revealControlsWhenTouched(video) {
    if (Flags.onDesktopDevice) {
      return;
    }
    video.addEventListener("touchend", () => {
      this.toggleVideoControls(true);
    }, {
      passive: true
    });
  }

  loadVideoClips() {
    Events.global.postProcess.on(() => {
      setTimeout(() => {
        let storedVideoClips;

        try {
          storedVideoClips = JSON.parse(localStorage.getItem("storedVideoClips") || "{}");

          for (const [id, videoClip] of Object.entries(storedVideoClips)) {
            this.videoClips.set(id, new VideoClip(videoClip));
          }
        } catch (error) {
          console.error(error);
        }
      }, 50);
    });
  }

  /**
   * @returns {HTMLVideoElement}
   */
  getActiveVideoPlayer() {
    return this.videoPlayers.find(video => video.hasAttribute("active")) || this.videoPlayers[0];
  }

  /**
   * @returns {HTMLVideoElement[]}
   */
  getInactiveVideoPlayers() {
    return this.videoPlayers.filter(video => !video.hasAttribute("active"));
  }

  /**
   * @param {HTMLElement} thumb
   */
  playVideo(thumb) {
    this.setActiveVideoPlayer(thumb);
    this.toggleVideoContainer(true);
    this.stopAllVideos();
    const video = this.getActiveVideoPlayer();

    this.setVideoSource(video, thumb);
    video.style.display = "block";
    video.play().catch(() => { });
    this.toggleVideoControls(true);
  }

  stopAllVideos() {
    for (const video of this.videoPlayers) {
      this.stopVideo(video);
    }
  }

  /**
   * @param {HTMLVideoElement} video
   */
  stopVideo(video) {
    video.style.display = "none";
    this.pauseVideo(video);
  }

  /**
   * @param {HTMLVideoElement} video
   */
  pauseVideo(video) {
    video.pause();
    video.removeAttribute("controls");
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  async preloadVideoPlayers(thumbs) {
    const activeVideoPlayer = this.getActiveVideoPlayer();
    const inactiveVideoPlayers = this.getInactiveVideoPlayers();
    const videoThumbsAroundInitialThumb = thumbs
      .filter(thumb => Utils.isVideo(thumb) && !this.videoPlayerHasSource(activeVideoPlayer, thumb))
      .slice(0, inactiveVideoPlayers.length);
    const loadedVideoSources = new Set(inactiveVideoPlayers
      .map(video => video.src)
      .filter(src => src !== ""));
    const videoSourcesAroundInitialThumb = new Set(videoThumbsAroundInitialThumb.map(thumb => this.getVideoSource(thumb)));
    const videoThumbsNotLoaded = videoThumbsAroundInitialThumb.filter(thumb => !loadedVideoSources.has(this.getVideoSource(thumb)));
    const freeInactiveVideoPlayers = inactiveVideoPlayers.filter(video => !videoSourcesAroundInitialThumb.has(video.src));

    for (let i = 0; i < freeInactiveVideoPlayers.length && i < videoThumbsNotLoaded.length; i += 1) {
      await Utils.sleep(50);
      this.setVideoSource(freeInactiveVideoPlayers[i], videoThumbsNotLoaded[i]);
      this.pauseVideo(freeInactiveVideoPlayers[i]);
    }
  }

  /**
   * @param {HTMLVideoElement} video
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  videoPlayerHasSource(video, thumb) {
    return video.src === this.getVideoSource(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  getVideoSource(thumb) {
    return ImageUtils.getOriginalImageURLWithoutExtension(thumb).replace("jpg", "mp4");
  }

  /**
   * @param {HTMLVideoElement} video
   * @param {HTMLElement} thumb
   */
  setVideoSource(video, thumb) {
    if (this.videoPlayerHasSource(video, thumb)) {
      return;
    }
    this.createVideoClip(video, thumb);
    video.src = this.getVideoSource(thumb);
  }

  /**
   * @param {HTMLVideoElement} video
   * @param {HTMLElement} thumb
   */
  createVideoClip(video, thumb) {
    const videoClip = this.videoClips.get(thumb.id);

    if (videoClip === undefined) {
      video.ontimeupdate = null;
      return;
    }
    video.ontimeupdate = () => {
      if (video.currentTime < videoClip.start || video.currentTime > videoClip.end) {
        video.removeAttribute("controls");
        video.currentTime = videoClip.start;
      }
    };
  }

  /**
   * @param {HTMLElement} thumb
   */
  setActiveVideoPlayer(thumb) {
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

  /**
   * @param {Boolean} value
   */
  toggleVideoControls(value) {
    const video = this.getActiveVideoPlayer();

    if (Flags.onMobileDevice) {
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

  clearInactiveVideoSources() {
    const videoPlayers = this.getInactiveVideoPlayers();

    for (const video of videoPlayers) {
      video.src = "";
    }
  }

  clearVideoSources() {
    for (const video of this.videoPlayers) {
      video.src = "";
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleVideoLooping(value) {
    for (const video of this.videoPlayers) {
      video.toggleAttribute("loop", value);
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleVideoContainer(value) {
    if (this.videoContainer !== null) {
      this.videoContainer.style.display = value ? "block" : "none";
    }
  }

  toggleActiveVideoPause() {
    if (document.activeElement !== this.getActiveVideoPlayer()) {
      this.toggleVideoPause(this.getActiveVideoPlayer());
    }
  }

  restartActiveVideo() {
    this.getActiveVideoPlayer().play().catch();
  }
}
