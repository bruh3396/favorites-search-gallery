const autoplayHTML = `<div id="autoplay-menu-container">
  <style>
    #autoplay-menu-container {
      visibility: hidden;
    }

    #autoplay-menu {
      position: fixed;
      left: 50%;
      transform: translate(-50%);
      bottom: 5%;
      padding: 0;
      margin: 0;
      background: rgba(40, 40, 40, 1);
      border-radius: 4px;
      white-space: nowrap;
      z-index: 10000;
      opacity: 0;
      transition: opacity .25s ease-in-out;

      &.visible {
        opacity: 1;
      }

      &.persistent {
        opacity: 1 !important;
        visibility: visible !important;
      }

      >div>img {
        color: red;
        position: relative;
        height: 75px;
        cursor: pointer;
        background-color: rgba(128, 128, 128, 0);
        margin: 5px;
        background-size: 10%;
        z-index: 3;
        border-radius: 4px;


        &:hover {
          background-color: rgba(200, 200, 200, .5);
        }
      }
    }

    .autoplay-progress-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 0%;
      height: 100%;
      background-color: steelblue;
      z-index: 1;
    }

    #autoplay-video-progress-bar {
      background-color: hotpink;
    }

    #autoplay-settings-menu {
      visibility: hidden;
      position: absolute;
      top: 0;
      left: 50%;
      transform: translate(-50%, -105%);
      border-radius: 4px;
      font-size: 10px !important;
      color: white;
      background: rgba(40, 40, 40, 1);

      &.visible {
        visibility: visible;
      }

      >div {
        font-size: 30px;

        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 10px;

        >label {
          padding-right: 20px;
        }
      }
    }

    #autoplay-settings-button.settings-menu-opened {
      filter: drop-shadow(6px 6px 3px #0075FF);
    }


    #autoplay-change-direction-mask {
      filter: drop-shadow(2px 2px 3px #0075FF);
    }

    #autoplay-play-button:active {
      filter: drop-shadow(2px 2px 10px #0075FF);
    }

    #autoplay-change-direction-mask-container {
      pointer-events: none;
      opacity: 0.75;
      height: 75px;
      width: 75px;
      margin: 5px;
      border-radius: 4px;
      right: 0;
      bottom: 0;
      z-index: 4;
      position: absolute;
      clip-path: polygon(0% 0%, 0% 100%, 100% 100%);

      &.upper-right {
        clip-path: polygon(0% 0%, 100% 0%, 100% 100%);
      }
    }

    .autoplay-settings-menu-label {
      pointer-events: none;
    }
  </style>
  <div id="autoplay-menu" class="not-highlightable">
    <div id="autoplay-buttons">
      <img id="autoplay-settings-button" title="Autoplay Settings">
      <img id="autoplay-play-button" title="Pause Autoplay">
      <img id="autoplay-change-direction-button" title="Change Autoplay Direction">
      <div id="autoplay-change-direction-mask-container">
        <img id="autoplay-change-direction-mask" title="Change Autoplay Direction">
      </div>
    </div>
    <div id="autoplay-image-progress-bar" class="autoplay-progress-bar"></div>
    <div id="autoplay-video-progress-bar" class="autoplay-progress-bar"></div>
    <div id="autoplay-settings-menu">
      <div>
        <label for="autoplay-image-duration-input">Image/GIF Duration</label>
        <span class="number">
          <hold-button class="number-arrow-down" pollingtime="100"><span>&lt;</span></hold-button>
          <input type="number" id="autoplay-image-duration-input" min="1" max="60" step="1" style="width: 5ch;">
          <hold-button class="number-arrow-up" pollingtime="100"><span>&gt;</span></hold-button>
        </span>
      </div>
      <div>
        <label for="autoplay-minimum-video-duration-input">Minimum Video Duration</label>
        <span class="number">
          <hold-button class="number-arrow-down" pollingtime="100"><span>&lt;</span></hold-button>
          <input type="number" id="autoplay-minimum-animated-duration-input" min="1" max="60" step="1"
            style="width: 5ch;">
          <hold-button class="number-arrow-up" pollingtime="100"><span>&gt;</span></hold-button>
        </span>
      </div>
    </div>
  </div>
</div>`;

class AutoplayListenerList {
  /**
   * @type {Function}
  */
  onEnable;
  /**
   * @type {Function}
  */
  onDisable;
  /**
   * @type {Function}
  */
  onPause;
  /**
   * @type {Function}
  */
  onResume;
  /**
   * @type {Function}
  */
  onComplete;
  /**
   * @type {Function}
  */
  onVideoEndedTooEarly;

  /**
   * @param {Function} onEnable
   * @param {Function} onDisable
   * @param {Function} onPause
   * @param {Function} onResume
   * @param {Function} onComplete
   * @param {Function} onVideoEndedEarly
   */
  constructor(onEnable, onDisable, onPause, onResume, onComplete, onVideoEndedEarly) {
    this.onEnable = onEnable;
    this.onDisable = onDisable;
    this.onPause = onPause;
    this.onResume = onResume;
    this.onComplete = onComplete;
    this.onVideoEndedTooEarly = onVideoEndedEarly;
  }
}

class Autoplay {
  static preferences = {
    active: "autoplayActive",
    paused: "autoplayPaused",
    imageDuration: "autoplayImageDuration",
    minimumVideoDuration: "autoplayMinimumVideoDuration",
    direction: "autoplayForward"
  };
  static menuIconImageURLs = {
    play: createObjectURLFromSvg(ICONS.play),
    pause: createObjectURLFromSvg(ICONS.pause),
    changeDirection: createObjectURLFromSvg(ICONS.changeDirection),
    changeDirectionAlt: createObjectURLFromSvg(ICONS.changeDirectionAlt),
    tune: createObjectURLFromSvg(ICONS.tune)
  };
  static settings = {
    imageViewDuration: getPreference(Autoplay.preferences.imageDuration, 1000),
    minimumVideoDuration: getPreference(Autoplay.preferences.minimumVideoDuration, 5000),
    menuVisibilityDuration: 500,
    settingsMenuInputDebounceTime: 100,
    moveForward: getPreference(Autoplay.preferences.direction, true),

    get imageViewDurationInSeconds() {
      return millisecondsToSeconds(this.imageViewDuration);
    },

    get minimumVideoDurationInSeconds() {
      return millisecondsToSeconds(this.minimumVideoDuration);
    }
  };

  /**
   * @type {Boolean}
  */
  static get disabled() {
    return onMobileDevice();
  }

  /**
  * @type {{
  * container: HTMLDivElement,
  * menu: HTMLDivElement,
  * settingsButton: HTMLImageElement,
  * settingsMenu: {
  *  container: HTMLDivElement
  *  imageDurationInput: HTMLInputElement,
  *  minimumVideoDurationInput: HTMLInputElement,
  * }
  * playButton: HTMLImageElement,
  * changeDirectionButton: HTMLImageElement,
  * changeDirectionMask: {
  *   container: HTMLDivElement,
  *   image: HTMLImageElement
  * },
  * imageProgressBar: HTMLDivElement
  * videoProgressBar: HTMLDivElement
  * }}
  */
  ui;
  /**
   * @type {AutoplayListenerList}
  */
  subscribers;
  /**
   * @type {AbortController}
  */
  eventListenersAbortController;
  /**
   * @type {HTMLElement}
  */
  currentThumb;
  /**
   * @type {Cooldown}
  */
  imageViewTimer;
  /**
   * @type {Cooldown}
  */
  menuVisibilityTimer;
  /**
   * @type {Cooldown}
  */
  videoViewTimer;
  /**
   * @type {Cooldown}
  */
  settingsMenuInputDebounce;
  /**
   * @type {Boolean}
  */
  active;
  /**
   * @type {Boolean}
  */
  paused;
  /**
   * @type {Boolean}
  */
  menuIsPersistent;
  /**
   * @type {Boolean}
  */
  menuIsVisible;

  /**
   * @param {AutoplayListenerList} subscribers
   */
  constructor(subscribers) {
    if (Autoplay.disabled) {
      return;
    }
    this.initializeSubscribers(subscribers);
    this.initializeFields();
    this.initializeTimers();
    this.injectHTML();
    this.setMenuIconImageSources();
    this.loadAutoplaySettingsIntoUi();
    this.addEventListeners();
  }

  /**
   * @param {AutoplayListenerList} subscribers
   */
  initializeSubscribers(subscribers) {
    this.subscribers = subscribers;

    const onComplete = subscribers.onComplete;

    this.subscribers.onComplete = () => {
      if (this.active && !this.paused) {
        onComplete();
      }
    };
  }

  initializeFields() {
    this.ui = {
      settingsMenu: {},
      changeDirectionMask: {}
    };
    this.eventListenersAbortController = new AbortController();
    this.currentThumb = null;
    this.active = getPreference(Autoplay.preferences.active, false);
    this.paused = getPreference(Autoplay.preferences.paused, false);
    this.menuIsPersistent = false;
    this.menuIsVisible = false;
  }

  initializeTimers() {
    this.imageViewTimer = new Cooldown(Autoplay.settings.imageViewDuration);
    this.menuVisibilityTimer = new Cooldown(Autoplay.settings.menuVisibilityDuration);
    this.settingsMenuInputDebounce = new Cooldown(Autoplay.settings.settingsMenuInputDebounceTime, true);
    this.videoViewTimer = new Cooldown(Autoplay.settings.minimumVideoDuration);

    this.imageViewTimer.onCooldownEnd = () => { };
    this.menuVisibilityTimer.onCooldownEnd = () => {
      this.hideMenu();
      setTimeout(() => {
        if (!this.menuIsPersistent && !this.menuIsVisible) {
          this.toggleSettingMenu(false);
        }
      }, 100);
    };
    this.settingsMenuInputDebounce.onDebounceEnd = () => { };
  }

  injectHTML() {
    this.injectMenuHTML();
    this.injectOptionHTML();
    this.injectImageProgressHTML();
    this.injectVideoProgressHTML();
  }

  injectMenuHTML() {
    document.body.insertAdjacentHTML("afterbegin", autoplayHTML);
    this.ui.container = document.getElementById("autoplay-menu-container");
    this.ui.menu = document.getElementById("autoplay-menu");
    this.ui.settingsButton = document.getElementById("autoplay-settings-button");
    this.ui.settingsMenu.container = document.getElementById("autoplay-settings-menu");
    this.ui.settingsMenu.imageDurationInput = document.getElementById("autoplay-image-duration-input");
    this.ui.settingsMenu.minimumVideoDurationInput = document.getElementById("autoplay-minimum-animated-duration-input");
    this.ui.playButton = document.getElementById("autoplay-play-button");
    this.ui.changeDirectionButton = document.getElementById("autoplay-change-direction-button");
    this.ui.changeDirectionMask.container = document.getElementById("autoplay-change-direction-mask-container");
    this.ui.changeDirectionMask.image = document.getElementById("autoplay-change-direction-mask");
    this.ui.imageProgressBar = document.getElementById("autoplay-image-progress-bar");
    this.ui.videoProgressBar = document.getElementById("autoplay-video-progress-bar");
  }

  injectOptionHTML() {
    addOptionToFavoritesPage(
      "autoplay",
      "Autoplay",
      "Enable autoplay in gallery.",
      this.active,
      (event) => {
        this.toggle(event.target.checked);
      },
      true
    );
  }

  injectImageProgressHTML() {
    injectStyleHTML(`
      #autoplay-image-progress-bar.animated {
          transition: width ${Autoplay.settings.imageViewDurationInSeconds}s linear;
          width: 100%;
      }
      `, "autoplay-image-progress-bar-animation");
  }

  injectVideoProgressHTML() {
    injectStyleHTML(`
      #autoplay-video-progress-bar.animated {
          transition: width ${Autoplay.settings.minimumVideoDurationInSeconds}s linear;
          width: 100%;
      }
      `, "autoplay-video-progress-bar-animation");
  }

  setMenuIconImageSources() {
    this.ui.playButton.src = this.paused ? Autoplay.menuIconImageURLs.play : Autoplay.menuIconImageURLs.pause;
    this.ui.settingsButton.src = Autoplay.menuIconImageURLs.tune;
    this.ui.changeDirectionButton.src = Autoplay.menuIconImageURLs.changeDirection;
    this.ui.changeDirectionMask.image.src = Autoplay.menuIconImageURLs.changeDirectionAlt;
    this.ui.changeDirectionMask.container.classList.toggle("upper-right", Autoplay.settings.moveForward);
  }

  loadAutoplaySettingsIntoUi() {
    this.ui.settingsMenu.imageDurationInput.value = Autoplay.settings.imageViewDurationInSeconds;
    this.ui.settingsMenu.minimumVideoDurationInput.value = Autoplay.settings.minimumVideoDurationInSeconds;
  }

  addEventListeners() {
    this.addMenuEventListeners();
    this.addSettingsMenuEventListeners();
  }

  addMenuEventListeners() {
    this.ui.settingsButton.onclick = () => {
      this.toggleSettingMenu();
    };
    this.ui.playButton.onclick = () => {
      this.pause();
    };
    this.ui.changeDirectionButton.onclick = () => {
      Autoplay.settings.moveForward = !Autoplay.settings.moveForward;
      this.ui.changeDirectionMask.container.classList.toggle("upper-right", Autoplay.settings.moveForward);
      setPreference(Autoplay.preferences.direction, Autoplay.settings.moveForward);
    };

    this.ui.menu.onmouseenter = () => {
      this.toggleMenuPersistence(true);
    };
    this.ui.menu.onmouseleave = () => {
      this.toggleMenuPersistence(false);
    };
  }

  addSettingsMenuEventListeners() {
    this.ui.settingsMenu.imageDurationInput.onchange = () => {
      this.settingsMenuInputDebounce.startDebounce();

      this.settingsMenuInputDebounce.onDebounceEnd = () => {
        this.setImageViewDuration();

        if (this.currentThumb !== null && isImage(this.currentThumb)) {
          this.startViewTimer(this.currentThumb);
        }
      };
    };
    this.ui.settingsMenu.minimumVideoDurationInput.onchange = () => {
      this.settingsMenuInputDebounce.startDebounce();

      this.settingsMenuInputDebounce.onDebounceEnd = () => {
        this.setMinimumVideoViewDuration();

        if (this.currentThumb !== null && !isImage(this.currentThumb)) {
          this.startViewTimer(this.currentThumb);
        }
      };
    };
  }

  /**
   * @param {Boolean} value
   */
  toggleMenuPersistence(value) {
    this.menuIsPersistent = value;
    this.ui.menu.classList.toggle("persistent", value);
  }

  /**
   * @param {Boolean} value
   */
  toggleMenuVisibility(value) {
    this.menuIsVisible = value;
    this.ui.menu.classList.toggle("visible", value);
  }

  /**
   * @param {Boolean} value
   */
  toggleSettingMenu(value) {
    if (value === undefined) {
      this.ui.settingsMenu.container.classList.toggle("visible");
      this.ui.settingsButton.classList.toggle("settings-menu-opened");
    } else {
      this.ui.settingsMenu.container.classList.toggle("visible", value);
      this.ui.settingsButton.classList.toggle("settings-menu-opened", value);
    }
  }

  /**
   * @param {Boolean} value
   */
  toggle(value) {
    setPreference(Autoplay.preferences.active, value);
    this.active = value;

    if (value) {
      this.subscribers.onEnable();
    } else {
      this.subscribers.onDisable();
    }
  }

  setImageViewDuration() {
    let durationInSeconds = parseFloat(this.ui.settingsMenu.imageDurationInput.value);

    if (isNaN(durationInSeconds)) {
      durationInSeconds = Autoplay.settings.imageViewDurationInSeconds;
    }
    const duration = Math.round(clamp(durationInSeconds * 1000, 1000, 60000));

    setPreference(Autoplay.preferences.imageDuration, duration);
    Autoplay.settings.imageViewDuration = duration;
    this.imageViewTimer.waitTime = duration;
    this.ui.settingsMenu.imageDurationInput.value = Autoplay.settings.imageViewDurationInSeconds;
    this.injectImageProgressHTML();
  }

  setMinimumVideoViewDuration() {
    let durationInSeconds = parseFloat(this.ui.settingsMenu.minimumVideoDurationInput.value);

    if (isNaN(durationInSeconds)) {
      durationInSeconds = Autoplay.settings.minimumVideoDurationInSeconds;
    }
    const duration = Math.round(clamp(durationInSeconds * 1000, 0, 60000));

    setPreference(Autoplay.preferences.minimumVideoDuration, duration);
    Autoplay.settings.minimumVideoDuration = duration;
    this.ui.settingsMenu.minimumVideoDurationInput.value = Autoplay.settings.minimumVideoDurationInSeconds;
    this.injectVideoProgressHTML();
  }

  /**
   * @param {HTMLElement} thumb
   */
  startViewTimer(thumb) {
    if (!this.active || Autoplay.disabled || this.paused || thumb === null) {
      return;
    }
    this.currentThumb = thumb;

    if (isVideo(thumb)) {
      this.startVideoViewTimer();
    } else {
      this.startImageViewTimer();
    }
  }

  startImageViewTimer() {
    this.stopVideoProgressBar();
    this.stopVideoViewTimer();

    this.startImageProgressBar();
    this.imageViewTimer.restart();
  }

  stopImageViewTimer() {
    this.imageViewTimer.stop();
    this.stopImageProgressBar();
  }

  startVideoViewTimer() {
    this.stopImageViewTimer();
    this.stopImageProgressBar();

    this.startVideoProgressBar();
    this.videoViewTimer.restart();
  }

  stopVideoViewTimer() {
    this.videoViewTimer.stop();
    this.stopImageProgressBar();
  }

  /**
   * @param {HTMLElement} thumb
   */
  start(thumb) {
    if (!this.active || Autoplay.disabled) {
      return;
    }
    this.addAutoplayEventListeners();
    this.ui.container.style.visibility = "visible";
    this.showMenu();
    this.startViewTimer(thumb);
  }

  stop() {
    if (Autoplay.disabled) {
      return;
    }
    this.ui.container.style.visibility = "hidden";
    this.removeAutoplayEventListeners();
    this.stopImageViewTimer();
    this.forceHideMenu();
  }

  pause() {
    this.paused = !this.paused;
    setPreference(Autoplay.preferences.paused, this.paused);

    if (this.paused) {
      this.ui.playButton.src = Autoplay.menuIconImageURLs.play;
      this.ui.playButton.title = "Resume Autoplay";
      this.stopImageViewTimer();
      this.subscribers.onPause();
    } else {
      this.ui.playButton.src = Autoplay.menuIconImageURLs.pause;
      this.ui.playButton.title = "Pause Autoplay";
      this.startViewTimer(this.currentThumb);
      this.subscribers.onResume();
    }
  }

  onVideoEnded() {
    if (this.videoViewTimer.timeout === null) {
      this.subscribers.onComplete();
    } else {
      this.subscribers.onVideoEndedTooEarly();
    }
  }

  addAutoplayEventListeners() {
    this.imageViewTimer.onCooldownEnd = () => {
      this.subscribers.onComplete();
    };
    document.addEventListener("mousemove", () => {
      this.showMenu();
    }, {
      signal: this.eventListenersAbortController.signal
    });
  }

  removeAutoplayEventListeners() {
    this.imageViewTimer.onCooldownEnd = () => { };
    this.eventListenersAbortController.abort();
    this.eventListenersAbortController = new AbortController();
  }

  showMenu() {
    this.toggleMenuVisibility(true);
    this.menuVisibilityTimer.restart();
  }

  hideMenu() {
    this.toggleMenuVisibility(false);
  }

  forceHideMenu() {
    this.toggleMenuPersistence(false);
    this.toggleMenuVisibility(false);
    this.toggleSettingMenu(false);
  }

  startImageProgressBar() {
    this.stopImageProgressBar();
    setTimeout(() => {
      this.ui.imageProgressBar.classList.add("animated");
    }, 10);
  }

  stopImageProgressBar() {
    this.ui.imageProgressBar.classList.remove("animated");
  }

  startVideoProgressBar() {
    this.stopVideoProgressBar();
    setTimeout(() => {
      this.ui.videoProgressBar.classList.add("animated");
    }, 10);
  }

  stopVideoProgressBar() {
    this.ui.videoProgressBar.classList.remove("animated");
  }

}
