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
  onVideoEndedBeforeMinimumViewTime;

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
    this.onVideoEndedBeforeMinimumViewTime = onVideoEndedEarly;
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
    play: Utils.createObjectURLFromSvg(Utils.icons.play),
    pause: Utils.createObjectURLFromSvg(Utils.icons.pause),
    changeDirection: Utils.createObjectURLFromSvg(Utils.icons.changeDirection),
    changeDirectionAlt: Utils.createObjectURLFromSvg(Utils.icons.changeDirectionAlt),
    tune: Utils.createObjectURLFromSvg(Utils.icons.tune)
  };
  static settings = {
    imageViewDuration: Utils.getPreference(Autoplay.preferences.imageDuration, 3000),
    minimumVideoDuration: Utils.getPreference(Autoplay.preferences.minimumVideoDuration, 5000),
    menuVisibilityDuration: Utils.onMobileDevice() ? 1500 : 500,
    moveForward: Utils.getPreference(Autoplay.preferences.direction, true),

    get imageViewDurationInSeconds() {
      return Utils.millisecondsToSeconds(this.imageViewDuration);
    },

    get minimumVideoDurationInSeconds() {
      return Utils.millisecondsToSeconds(this.minimumVideoDuration);
    }
  };

  /**
   * @type {Boolean}
   */
  static get disabled() {
    return false;
    // return Utils.onMobileDevice();
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
  events;
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
   * @param {AutoplayListenerList} events
   */
  constructor(events) {
    if (Autoplay.disabled) {
      return;
    }
    this.initializeEvents(events);
    this.initializeFields();
    this.initializeTimers();
    this.insertHTML();
    this.configureMobileUi();
    this.extractUiElements();
    this.setMenuIconImageSources();
    this.setupNumberComponents();
    this.addEventListeners();
    this.loadAutoplaySettingsIntoUI();
  }

  /**
   * @param {AutoplayListenerList} events
   */
  initializeEvents(events) {
    this.events = events;

    const onComplete = events.onComplete;

    this.events.onComplete = () => {
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
    this.active = Utils.getPreference(Autoplay.preferences.active, Utils.onMobileDevice());
    this.paused = Utils.getPreference(Autoplay.preferences.paused, false);
    this.menuIsPersistent = false;
    this.menuIsVisible = false;
  }

  initializeTimers() {
    this.imageViewTimer = new Cooldown(Autoplay.settings.imageViewDuration);
    this.menuVisibilityTimer = new Cooldown(Autoplay.settings.menuVisibilityDuration);
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
  }

  insertHTML() {
    this.insertMenuHTML();
    this.insertOptionHTML();
    this.insertImageProgressHTML();
    this.insertVideoProgressHTML();
  }

  insertMenuHTML() {
    Utils.insertFavoritesSearchGalleryHTML("afterbegin", HTMLStrings.autoplay);
  }

  insertOptionHTML() {
    Utils.createFavoritesOption(
      "autoplay",
      "Autoplay",
      "Enable autoplay in gallery",
      this.active,
      (event) => {
        this.toggle(event.target.checked);
      },
      true
    );
  }

  insertImageProgressHTML() {
    Utils.insertStyleHTML(`
      #autoplay-image-progress-bar.animated {
          transition: width ${Autoplay.settings.imageViewDurationInSeconds}s linear;
          width: 100%;
      }
      `, "autoplay-image-progress-bar-animation");
  }

  insertVideoProgressHTML() {
    Utils.insertStyleHTML(`
      #autoplay-video-progress-bar.animated {
          transition: width ${Autoplay.settings.minimumVideoDurationInSeconds}s linear;
          width: 100%;
      }
      `, "autoplay-video-progress-bar-animation");
  }

  extractUiElements() {
    this.ui.container = document.getElementById("autoplay-container");
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

  configureMobileUi() {
    if (!Utils.onMobileDevice()) {
      return;
    }
    this.createViewDurationSelects();
  }

  createViewDurationSelects() {
    const imageViewDurationSelect = this.createDurationSelect(1, 60);
    const videoViewDurationSelect = this.createDurationSelect(0, 60);
    const imageViewDurationInput = document.getElementById("autoplay-image-duration-input").parentElement;
    const videoViewDurationInput = document.getElementById("autoplay-minimum-animated-duration-input").parentElement;

    imageViewDurationSelect.value = Autoplay.settings.imageViewDurationInSeconds;
    videoViewDurationSelect.value = Autoplay.settings.minimumVideoDurationInSeconds;
    imageViewDurationInput.insertAdjacentElement("afterend", imageViewDurationSelect);
    videoViewDurationInput.insertAdjacentElement("afterend", videoViewDurationSelect);
    imageViewDurationInput.remove();
    videoViewDurationInput.remove();
    imageViewDurationSelect.id = "autoplay-image-duration-input";
    videoViewDurationSelect.id = "autoplay-minimum-animated-duration-input";
  }

  /**
   * @param {Number} minimum
   * @param {Number} maximum
   * @returns {HTMLSelectElement}
   */
  createDurationSelect(minimum, maximum) {
    const select = document.createElement("select");

    for (let i = minimum; i <= maximum; i += 1) {
      const option = document.createElement("option");

      switch (true) {
        case i <= 5:
          break;

        case i <= 20:
          i += 4;
          break;

        case i <= 30:
          i += 9;
          break;

        default:
          i += 29;
          break;
      }
      option.value = i;
      option.innerText = i;
      select.append(option);
    }
    select.ontouchstart = () => {
      select.dispatchEvent(new Event("mousedown"));
    };
    return select;
  }

  setMenuIconImageSources() {
    this.ui.playButton.src = this.paused ? Autoplay.menuIconImageURLs.play : Autoplay.menuIconImageURLs.pause;
    this.ui.settingsButton.src = Autoplay.menuIconImageURLs.tune;
    this.ui.changeDirectionButton.src = Autoplay.menuIconImageURLs.changeDirection;
    this.ui.changeDirectionMask.image.src = Autoplay.menuIconImageURLs.changeDirectionAlt;
    this.ui.changeDirectionMask.container.classList.toggle("upper-right", Autoplay.settings.moveForward);
  }

  loadAutoplaySettingsIntoUI() {
    this.ui.settingsMenu.imageDurationInput.value = Autoplay.settings.imageViewDurationInSeconds;
    this.ui.settingsMenu.minimumVideoDurationInput.value = Autoplay.settings.minimumVideoDurationInSeconds;
  }

  setupNumberComponents() {
    for (const input of [this.ui.settingsMenu.imageDurationInput, this.ui.settingsMenu.minimumVideoDurationInput]) {
      const element = input.closest(".number");

      if (element !== null) {
        const numberComponent = new NumberComponent(element);
      }
    }
  }

  addEventListeners() {
    this.addMenuEventListeners();
    this.addSettingsMenuEventListeners();
  }

  addMenuEventListeners() {
    this.addDesktopMenuEventListeners();
    this.addMobileMenuEventListeners();
  }

  addDesktopMenuEventListeners() {
    if (Utils.onMobileDevice()) {
      return;
    }
    this.ui.settingsButton.onclick = () => {
      this.toggleSettingMenu();
    };
    this.ui.playButton.onclick = () => {
      this.pause();
    };
    this.ui.changeDirectionButton.onclick = () => {
      this.toggleDirection();
    };
    this.ui.menu.onmouseenter = () => {
      this.toggleMenuPersistence(true);
    };
    this.ui.menu.onmouseleave = () => {
      this.toggleMenuPersistence(false);
    };
  }

  addMobileMenuEventListeners() {
    if (!Utils.onMobileDevice()) {
      return;
    }
    this.ui.settingsButton.ontouchstart = () => {
      this.toggleSettingMenu();
      const settingsMenuIsVisible = this.ui.settingsMenu.container.classList.contains("visible");

      this.toggleMenuPersistence(settingsMenuIsVisible);
      this.menuVisibilityTimer.restart();
    };
    this.ui.playButton.ontouchstart = () => {
      this.pause();
      this.menuVisibilityTimer.restart();
    };
    this.ui.changeDirectionButton.ontouchstart = () => {
      this.toggleDirection();
      this.menuVisibilityTimer.restart();
    };
  }

  addSettingsMenuEventListeners() {
    this.ui.settingsMenu.imageDurationInput.onchange = () => {
      this.setImageViewDuration();

      if (this.currentThumb !== null && Utils.isImage(this.currentThumb)) {
        this.startViewTimer(this.currentThumb);
      }
    };
    this.ui.settingsMenu.minimumVideoDurationInput.onchange = () => {
      this.setMinimumVideoViewDuration();

      if (this.currentThumb !== null && !Utils.isImage(this.currentThumb)) {
        this.startViewTimer(this.currentThumb);
      }
    };
  }

  /**
   * @param {Boolean} forward
   */
  toggleDirection(forward) {
    const directionHasNotChanged = forward === Autoplay.settings.moveForward;

    if (directionHasNotChanged) {
      return;
    }
    Autoplay.settings.moveForward = !Autoplay.settings.moveForward;
    this.ui.changeDirectionMask.container.classList.toggle("upper-right", Autoplay.settings.moveForward);
    Utils.setPreference(Autoplay.preferences.direction, Autoplay.settings.moveForward);
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
    Utils.setPreference(Autoplay.preferences.active, value);
    this.active = value;

    if (value) {
      this.events.onEnable();
    } else {
      this.events.onDisable();
    }
  }

  setImageViewDuration() {
    let durationInSeconds = parseFloat(this.ui.settingsMenu.imageDurationInput.value);

    if (isNaN(durationInSeconds)) {
      durationInSeconds = Autoplay.settings.imageViewDurationInSeconds;
    }
    const duration = Math.round(Utils.clamp(durationInSeconds * 1000, 1000, 60000));

    Utils.setPreference(Autoplay.preferences.imageDuration, duration);
    Autoplay.settings.imageViewDuration = duration;
    this.imageViewTimer.waitTime = duration;
    this.ui.settingsMenu.imageDurationInput.value = Autoplay.settings.imageViewDurationInSeconds;
    this.insertImageProgressHTML();
  }

  setMinimumVideoViewDuration() {
    let durationInSeconds = parseFloat(this.ui.settingsMenu.minimumVideoDurationInput.value);

    if (isNaN(durationInSeconds)) {
      durationInSeconds = Autoplay.settings.minimumVideoDurationInSeconds;
    }
    const duration = Math.round(Utils.clamp(durationInSeconds * 1000, 0, 60000));

    Utils.setPreference(Autoplay.preferences.minimumVideoDuration, duration);
    Autoplay.settings.minimumVideoDuration = duration;
    this.videoViewTimer.waitTime = duration;
    this.ui.settingsMenu.minimumVideoDurationInput.value = Autoplay.settings.minimumVideoDurationInSeconds;
    this.insertVideoProgressHTML();
  }

  /**
   * @param {HTMLElement} thumb
   */
  startViewTimer(thumb) {
    if (thumb === null) {
      return;
    }
    this.currentThumb = thumb;

    if (!this.active || Autoplay.disabled || this.paused) {
      return;
    }

    if (Utils.isVideo(thumb)) {
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
    this.stopVideoProgressBar();
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
    this.stopVideoViewTimer();
    this.forceHideMenu();
  }

  pause() {
    this.paused = !this.paused;
    Utils.setPreference(Autoplay.preferences.paused, this.paused);

    if (this.paused) {
      this.ui.playButton.src = Autoplay.menuIconImageURLs.play;
      this.ui.playButton.title = "Resume Autoplay";
      this.stopImageViewTimer();
      this.stopVideoViewTimer();
      this.events.onPause();
    } else {
      this.ui.playButton.src = Autoplay.menuIconImageURLs.pause;
      this.ui.playButton.title = "Pause Autoplay";
      this.startViewTimer(this.currentThumb);
      this.events.onResume();
    }
  }

  onVideoEnded() {
    if (this.videoViewTimer.timeout === null) {
      this.events.onComplete();
    } else {
      this.events.onVideoEndedBeforeMinimumViewTime();
    }
  }

  addAutoplayEventListeners() {
    this.imageViewTimer.onCooldownEnd = () => {
      this.events.onComplete();
    };
    document.addEventListener("mousemove", () => {
      this.showMenu();
    }, {
      signal: this.eventListenersAbortController.signal
    });
    document.addEventListener("keydown", (event) => {
      if (!Utils.isHotkeyEvent(event)) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "p":
          this.showMenu();
          this.pause();
          break;

        case " ":
          if (this.currentThumb !== null && !Utils.isVideo(this.currentThumb)) {
            this.showMenu();
            this.pause();
          }
          break;

        default:
          break;
      }
    }, {
      signal: this.eventListenersAbortController.signal
    });
    window.addEventListener("videoEnded", () => {
      this.onVideoEnded();
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
