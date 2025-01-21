class VideoController {
  static preferences = {
    videoVolume: "videoVolume",
    videoMuted: "videoMuted"
  };
  /**
   * @type {HTMLAnchorElement}
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
    this.initializeFields();
    this.extractElements();
    this.createVideoBackgrounds();
    this.addVideoPlayerEventListeners();
    this.loadVideoVolume();
    this.loadVideoClips();
  }

  initializeFields() {
    this.videoClips = new Map();
  }

  extractElements() {
    this.videoContainer = document.getElementById("original-video-container");
    this.videoPlayers = Array.from(document.querySelectorAll("#original-video-container>video"));
  }

  createVideoBackgrounds() {
    document.createElement("canvas").toBlob((blob) => {
      const videoBackgroundURL = URL.createObjectURL(blob);

      for (const video of this.videoPlayers) {
        video.setAttribute("poster", videoBackgroundURL);
      }
    });
  }

  addVideoPlayerEventListeners() {
    this.videoContainer.onclick = (event) => {
      if (!event.ctrlKey) {
        event.preventDefault();
      }
    };

    for (const video of this.videoPlayers) {
      video.addEventListener("mousemove", () => {
        if (!video.hasAttribute("controls")) {
          video.setAttribute("controls", "");
        }
      }, {
        passive: true
      });
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
      video.addEventListener("volumechange", (event) => {
        if (!event.target.hasAttribute("active")) {
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
      video.addEventListener("ended", () => {
        dispatchEvent(new Event("videoEnded"));
      }, {
        passive: true
      });
      video.addEventListener("dblclick", () => {
        dispatchEvent(new Event("videoDoubleClicked"));
      });

      if (Utils.onMobileDevice()) {
        video.addEventListener("touchend", () => {
          this.toggleVideoControls(true);
        }, {
          passive: true
        });
      }
    }
  }

  loadVideoVolume() {
    const video = this.getActiveVideoPlayer();

    video.volume = parseFloat(Utils.getPreference(VideoController.preferences.videoVolume, 1));
    video.muted = Utils.getPreference(VideoController.preferences.videoMuted, true);
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
  playOriginalVideo(thumb) {
    this.videoContainer.style.display = "block";
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
      return ThumbSelector.getAdjacentVideoThumbsOnCurrentPage(initialThumb, limit);
    }
    return ThumbSelector.getAdjacentVideoThumbsThroughoutAllPages(initialThumb, limit);
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
    // const videoPlayers = this.inGallery ? this.getInactiveVideoPlayers() : this.videoPlayers;
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
    if (value !== undefined) {
      this.videoContainer.style.display = value ? "block" : "none";
      return;
    }

    if (!this.currentlyHoveringOverVideoThumb() || this.videoContainer.style.display === "block") {
      this.videoContainer.style.display = "none";
    } else {
      this.videoContainer.style.display = "block";
    }
  }
}
