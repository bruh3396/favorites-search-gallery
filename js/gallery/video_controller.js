class VideoController {
  static preferences = {
    videoVolume: "videoVolume",
    videoMuted: "videoMuted"
  };
  /**
   * @type {HTMLElement | null}
   */
  videoContainer;
  /**
   * @type {HTMLVideoElement[]}
   */
  videoPlayers;
  /**
   * @type {Map.<String, VideoClip>}
   */
  videoClips;

  constructor() {
    this.videoContainer = document.getElementById("original-video-container");
    this.videoPlayers = Array.from(document.querySelectorAll("#original-video-container>video"));
    this.videoClips = new Map();
    this.preventVideoPlayersFromFlashingWhenLoaded();
    this.addEventListenersToVideoContainer();
    this.addEventListenersToVideoPlayers();
    this.loadVideoVolume();
    this.loadVideoClips();
  }

  preventVideoPlayersFromFlashingWhenLoaded() {
    document.createElement("canvas").toBlob((blob) => {
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
    if (Utils.onMobileDevice()) {
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

      if (video.paused) {
        video.play().catch(() => { });
      } else {
        video.pause();
      }
    }, {
      passive: true
    });
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
      Utils.setPreference(VideoController.preferences.videoVolume, video.volume);
      Utils.setPreference(VideoController.preferences.videoMuted, video.muted);

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
      dispatchEvent(new Event("videoDoubleClicked"));
    });
  }

  /**
   * @param {HTMLVideoElement} video
   */
  revealControlsWhenTouched(video) {
    if (!Utils.onMobileDevice()) {
      return;
    }
    video.addEventListener("touchend", () => {
      this.toggleVideoControls(true);
    }, {
      passive: true
    });
  }

  loadVideoVolume() {
    const video = this.getActiveVideoPlayer();

    video.volume = Number((Utils.getPreference(VideoController.preferences.videoVolume, 1)));
    video.muted = Boolean(Utils.getPreference(VideoController.preferences.videoMuted, true));
  }

  loadVideoClips() {
    window.addEventListener("postProcess", () => {
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
    video.pause();
    video.removeAttribute("controls");
  }

  /**
   * @param {HTMLElement} initialThumb
   */
  preloadInactiveVideoPlayers(initialThumb) {
    this.setActiveVideoPlayer(initialThumb);
    const inactiveVideoPlayers = this.getInactiveVideoPlayers();
    const videoThumbsAroundInitialThumb = this.getAdjacentVideoThumbs(initialThumb, inactiveVideoPlayers.length);
    const loadedVideoSources = new Set(inactiveVideoPlayers
      .map(video => video.src)
      .filter(src => src !== ""));
    const videoSourcesAroundInitialThumb = new Set(videoThumbsAroundInitialThumb.map(thumb => this.getVideoSource(thumb)));
    const videoThumbsNotLoaded = videoThumbsAroundInitialThumb.filter(thumb => !loadedVideoSources.has(this.getVideoSource(thumb)));
    const freeInactiveVideoPlayers = inactiveVideoPlayers.filter(video => !videoSourcesAroundInitialThumb.has(video.src));

    for (let i = 0; i < freeInactiveVideoPlayers.length && i < videoThumbsNotLoaded.length; i += 1) {
      this.setVideoSource(freeInactiveVideoPlayers[i], videoThumbsNotLoaded[i]);
    }
    this.stopAllVideos();
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @returns {HTMLElement[]}
   */
  getAdjacentVideoThumbs(initialThumb, limit) {
    if (Gallery.settings.loopAtEndOfGallery) {
      return ThumbSelector.getVideoThumbsAroundOnCurrentPage(initialThumb, limit);
    }
    return ThumbSelector.getVideoThumbsAroundThroughoutAllPages(initialThumb, limit);
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
    return Utils.getOriginalImageURLFromThumb(thumb).replace("jpg", "mp4");
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

    if (Utils.onMobileDevice()) {
      if (value) {
        video.setAttribute("controls", "");
      }
    } else {
      video.style.pointerEvents = value ? "auto" : "none";
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
}
