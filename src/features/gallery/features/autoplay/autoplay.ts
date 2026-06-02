import * as Icons from "../../../../assets/icons";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../../../../lib/environment";
import { clamp, millisecondsToSeconds } from "../../../../utils/number";
import { isImage, isVideo } from "../../../../lib/media/media_type_predicates";
import AUTOPLAY_CSS from "../../../../assets/css/autoplay.css";
import AUTOPLAY_HTML from "../../../../assets/html/autoplay.html";
import { DomEvents } from "../../../../app/input/dom_events";
import { Events } from "../../../../app/channels/events";
import { NavigationKey } from "../../../../types/input";
import { NumberComponent } from "../../../../lib/ui/elements/number_component";
import { Overlays } from "../../../../app/layout/shell";
import { Preferences } from "../../../../app/context/preferences";
import { Timer } from "../../../../lib/async/timer";
import { createObjectUrlFromSvg } from "../../../../utils/dom/svg";
import { insertStyle } from "../../../../utils/dom/injector";
import { throttle } from "../../../../lib/async/throttle";

export type AutoplayEvents = {
  setVideoLooping: (value: boolean) => void
  onComplete: (direction?: NavigationKey) => void
  onVideoEndedBeforeMinimumViewTime: () => void
}

type AutoplayMenuElements = {
  container: HTMLElement
  menu: HTMLElement
  settingsButton: HTMLImageElement
  settingsMenu: {
    container: HTMLElement
    imageDurationInput: HTMLInputElement
    minimumVideoDurationInput: HTMLInputElement
  }
  playButton: HTMLImageElement
  changeDirectionButton: HTMLImageElement
  changeDirectionMask: {
    container: HTMLElement
    image: HTMLImageElement
  }
  imageProgressBar: HTMLElement
  videoProgressBar: HTMLElement
}

const menuIcons = {
  play: createObjectUrlFromSvg(Icons.PLAY),
  pause: createObjectUrlFromSvg(Icons.PAUSE),
  changeDirection: createObjectUrlFromSvg(Icons.CHANGE_DIRECTION),
  changeDirectionAlt: createObjectUrlFromSvg(Icons.CHANGE_DIRECTION_2),
  tune: createObjectUrlFromSvg(Icons.TUNE)
};

const config = {
  imageViewDuration: Preferences.autoplayImageDuration.value,
  minimumVideoDuration: Preferences.autoplayMinimumVideoDuration.value,
  menuVisibilityDuration: ON_MOBILE_DEVICE ? 1_500 : 1_000,

  get imageViewDurationInSeconds(): number {
    return millisecondsToSeconds(this.imageViewDuration);
  },

  get minimumVideoDurationInSeconds(): number {
    return millisecondsToSeconds(this.minimumVideoDuration);
  }
};

let ui: AutoplayMenuElements;
let events: AutoplayEvents;
let eventListenersAbortController: AbortController;
let currentThumb: HTMLElement | null;
let imageViewTimer: Timer;
let menuVisibilityTimer: Timer;
let videoViewTimer: Timer;
let active: boolean;
let paused: boolean;
let menuIsPersistent: boolean;
let menuIsVisible: boolean;

export function setup(inEvents: AutoplayEvents): void {
  initializeFields();
  initializeEvents(inEvents);
  initializeTimers();
  insertHtml();
  configureMobileUi();
  extractUiElements();
  setMenuIconImageSources();
  setupNumberComponents();
  addEventListeners();
  loadAutoplaySettingsIntoUi();
  inEvents.setVideoLooping(!active || paused);
}

export function isPaused(): boolean {
  return paused;
}

export function isActive(): boolean {
  return active;
}

function initializeFields(): void {
  ui = {
    settingsMenu: {},
    changeDirectionMask: {}
  } as AutoplayMenuElements;
  eventListenersAbortController = new AbortController();
  currentThumb = null;
  active = Preferences.autoplayActive.value;
  paused = Preferences.autoplayPaused.value;
  menuIsPersistent = false;
  menuIsVisible = false;
}

function getDirection(): NavigationKey {
  return Preferences.autoplayForward.value ? "ArrowRight" : "ArrowLeft";
}

function initializeEvents(inEvents: AutoplayEvents): void {
  events = inEvents;
  const onComplete = events.onComplete;

  events.onComplete = (): void => {
    if (active && !paused) {
      onComplete(getDirection());
    }
  };
}

function initializeTimers(): void {
  imageViewTimer = new Timer(config.imageViewDuration);
  menuVisibilityTimer = new Timer(config.menuVisibilityDuration);
  videoViewTimer = new Timer(config.minimumVideoDuration);

  imageViewTimer.onTimerEnd = (): void => { };
  menuVisibilityTimer.onTimerEnd = (): void => {
    hideMenu();
    setTimeout(() => {
      if (!menuIsPersistent && !menuIsVisible) {
        toggleSettingMenu(false);
      }
    }, 100);
  };
}

function insertHtml(): void {
  insertMenuHtml();
  insertImageProgressHtml();
  insertVideoProgressHtml();
}

function insertMenuHtml(): void {
  insertStyle(AUTOPLAY_CSS);
  Overlays.insertAdjacentHTML("afterbegin", AUTOPLAY_HTML);
}

function insertImageProgressHtml(): void {
  insertStyle(`
      #autoplay-image-progress-bar.animated {
          transition: width ${config.imageViewDurationInSeconds}s linear;
          width: 100%;
      }

      body.autoplay::before {
        animation: progress ${config.imageViewDurationInSeconds}s linear forwards
      }
      `, "autoplay-image-progress");
}

function insertVideoProgressHtml(): void {
  insertStyle(`
      #autoplay-video-progress-bar.animated {
          transition: width ${config.minimumVideoDurationInSeconds}s linear;
          width: 100%;
      }
      `, "autoplay-video-progress");
}

function extractUiElements(): void {
  ui.container = document.getElementById("autoplay-container") as HTMLElement;
  ui.menu = document.getElementById("autoplay-menu") as HTMLElement;
  ui.settingsButton = document.getElementById("autoplay-settings-button") as HTMLImageElement;
  ui.settingsMenu.container = document.getElementById("autoplay-settings-menu") as HTMLElement;
  ui.settingsMenu.imageDurationInput = document.getElementById("autoplay-image-duration-input") as HTMLInputElement;
  ui.settingsMenu.minimumVideoDurationInput = document.getElementById("autoplay-minimum-animated-duration-input") as HTMLInputElement;
  ui.playButton = document.getElementById("autoplay-play-button") as HTMLImageElement;
  ui.changeDirectionButton = document.getElementById("autoplay-change-direction-button") as HTMLImageElement;
  ui.changeDirectionMask.container = document.getElementById("autoplay-change-direction-mask-container") as HTMLElement;
  ui.changeDirectionMask.image = document.getElementById("autoplay-change-direction-mask") as HTMLImageElement;
  ui.imageProgressBar = document.getElementById("autoplay-image-progress-bar") as HTMLElement;
  ui.videoProgressBar = document.getElementById("autoplay-video-progress-bar") as HTMLElement;
}

function configureMobileUi(): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  createViewDurationSelects();
}

function createViewDurationSelects(): void {
  const imageViewDurationSelect = createDurationSelect(1, 60);
  const videoViewDurationSelect = createDurationSelect(0, 60);
  const imageViewDurationInput = (document.getElementById("autoplay-image-duration-input") as HTMLElement).parentElement as HTMLElement;
  const videoViewDurationInput = (document.getElementById("autoplay-minimum-animated-duration-input") as HTMLElement).parentElement as HTMLElement;

  imageViewDurationSelect.value = String(config.imageViewDurationInSeconds);
  videoViewDurationSelect.value = String(config.minimumVideoDurationInSeconds);
  imageViewDurationInput.insertAdjacentElement("afterend", imageViewDurationSelect);
  videoViewDurationInput.insertAdjacentElement("afterend", videoViewDurationSelect);
  imageViewDurationInput.remove();
  videoViewDurationInput.remove();
  imageViewDurationSelect.id = "autoplay-image-duration-input";
  videoViewDurationSelect.id = "autoplay-minimum-animated-duration-input";
}

function createDurationSelect(minimum: number, maximum: number): HTMLSelectElement {
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
    option.value = String(i);
    option.innerText = String(i);
    select.append(option);
  }
  select.ontouchstart = (): void => {
    select.dispatchEvent(new Event("mousedown"));
  };
  return select;
}

function setMenuIconImageSources(): void {
  ui.playButton.src = paused ? menuIcons.play : menuIcons.pause;
  ui.settingsButton.src = menuIcons.tune;
  ui.changeDirectionButton.src = menuIcons.changeDirection;
  ui.changeDirectionMask.image.src = menuIcons.changeDirectionAlt;
  ui.changeDirectionMask.container.classList.toggle("autoplay-direction-mask--upper-right", Preferences.autoplayForward.value);
}

function loadAutoplaySettingsIntoUi(): void {
  ui.settingsMenu.imageDurationInput.value = String(config.imageViewDurationInSeconds);
  ui.settingsMenu.minimumVideoDurationInput.value = String(config.minimumVideoDurationInSeconds);
}

function setupNumberComponents(): void {
  for (const input of [ui.settingsMenu.imageDurationInput, ui.settingsMenu.minimumVideoDurationInput]) {
    const element = input.closest(".num-input");

    if (element instanceof HTMLElement) {
      new NumberComponent(element);
    }
  }
}

function addEventListeners(): void {
  addMenuEventListeners();
  addSettingsMenuEventListeners();
  addFavoritesPageEventListeners();
}

function addMenuEventListeners(): void {
  addDesktopMenuEventListeners();
  addMobileMenuEventListeners();
}

function addDesktopMenuEventListeners(): void {
  if (ON_MOBILE_DEVICE) {
    return;
  }
  ui.settingsButton.onclick = (): void => {
    toggleSettingMenu();
  };
  ui.playButton.onclick = (): void => {
    pause();
  };
  ui.changeDirectionButton.onclick = (): void => {
    toggleDirection();
  };
  ui.menu.onmouseenter = (): void => {
    toggleMenuPersistence(true);
  };
  ui.menu.onmouseleave = (): void => {
    toggleMenuPersistence(false);
  };
}

function addMobileMenuEventListeners(): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  ui.settingsButton.ontouchstart = (): void => {
    toggleSettingMenu();
    const settingsMenuIsVisible = ui.settingsMenu.container.classList.contains("autoplay-settings--visible");

    toggleMenuPersistence(settingsMenuIsVisible);
    menuVisibilityTimer.restart();
  };
  ui.playButton.ontouchstart = (): void => {
    pause();
    menuVisibilityTimer.restart();
  };
  ui.changeDirectionButton.ontouchstart = (): void => {
    toggleDirection();
    menuVisibilityTimer.restart();
  };
}

function addSettingsMenuEventListeners(): void {
  ui.settingsMenu.imageDurationInput.onchange = (): void => {
    setImageViewDuration();

    if (currentThumb !== null && isImage(currentThumb)) {
      startViewTimer(currentThumb);
    }
  };
  ui.settingsMenu.minimumVideoDurationInput.onchange = (): void => {
    setMinimumVideoViewDuration();

    if (currentThumb !== null && !isImage(currentThumb)) {
      startViewTimer(currentThumb);
    }
  };
}

function addFavoritesPageEventListeners(): void {
  Events.favorites.autoplayToggled.on((value) => {
    toggle(value);
  });
}

function toggleDirection(): void {
  Preferences.autoplayForward.set(!Preferences.autoplayForward.value);
  ui.changeDirectionMask.container.classList.toggle("autoplay-direction-mask--upper-right", Preferences.autoplayForward.value);
}

function toggleMenuPersistence(value: boolean): void {
  menuIsPersistent = value;
  ui.menu.classList.toggle("gallery-menu--persistent", value);
}

function toggleMenuVisibility(value: boolean): void {
  menuIsVisible = value;
  ui.menu.classList.toggle("autoplay-menu--visible", value);
}

function toggleSettingMenu(value?: boolean | undefined): void {
  if (value === undefined) {
    ui.settingsMenu.container.classList.toggle("autoplay-settings--visible");
    ui.settingsButton.classList.toggle("autoplay-settings-btn--open");
  } else {
    ui.settingsMenu.container.classList.toggle("autoplay-settings--visible", value);
    ui.settingsButton.classList.toggle("autoplay-settings-btn--open", value);
  }
}

function toggle(value: boolean): void {
  Preferences.autoplayActive.set(value);
  active = value;

  events.setVideoLooping(!value);
}

function setImageViewDuration(): void {
  let durationInSeconds = parseFloat(ui.settingsMenu.imageDurationInput.value);

  if (isNaN(durationInSeconds)) {
    durationInSeconds = config.imageViewDurationInSeconds;
  }
  const duration = Math.round(clamp(durationInSeconds * 1_000, 1_000, 6_0000));

  Preferences.autoplayImageDuration.set(duration);
  config.imageViewDuration = duration;
  imageViewTimer.waitTime = duration;
  ui.settingsMenu.imageDurationInput.value = String(config.imageViewDurationInSeconds);
  insertImageProgressHtml();
}

function setMinimumVideoViewDuration(): void {
  let durationInSeconds = parseFloat(ui.settingsMenu.minimumVideoDurationInput.value);

  if (isNaN(durationInSeconds)) {
    durationInSeconds = config.minimumVideoDurationInSeconds;
  }
  const duration = Math.round(clamp(durationInSeconds * 1_000, 0, 60_000));

  Preferences.autoplayMinimumVideoDuration.set(duration);
  config.minimumVideoDuration = duration;
  videoViewTimer.waitTime = duration;
  ui.settingsMenu.minimumVideoDurationInput.value = String(config.minimumVideoDurationInSeconds);
  insertVideoProgressHtml();
}

export function startViewTimer(thumb: HTMLElement | null): void {
  if (thumb === null) {
    return;
  }
  currentThumb = thumb;

  if (!active || paused) {
    return;
  }

  if (isVideo(thumb)) {
    startVideoViewTimer();
  } else {
    startImageViewTimer();
  }
}

function startImageViewTimer(): void {
  stopVideoProgressBar();
  stopVideoViewTimer();
  startImageProgressBar();
  imageViewTimer.restart();
}

function stopImageViewTimer(): void {
  imageViewTimer.stop();
  stopImageProgressBar();
}

function startVideoViewTimer(): void {
  stopImageViewTimer();
  stopImageProgressBar();
  startVideoProgressBar();
  videoViewTimer.restart();
}

function stopVideoViewTimer(): void {
  videoViewTimer.stop();
  stopVideoProgressBar();
}

export function startAutoplay(): void {
  if (!active) {
    return;
  }
  addAutoplayEventListeners();
  ui.container.style.visibility = "visible";
  showMenu();
}

export function stopAutoplay(): void {
  ui.container.style.visibility = "hidden";
  removeAutoplayEventListeners();
  stopImageViewTimer();
  stopVideoViewTimer();
  forceHideMenu();
}

function pause(): void {
  paused = !paused;
  Preferences.autoplayPaused.set(paused);

  if (paused) {
    ui.playButton.src = menuIcons.play;
    ui.playButton.title = "Resume Autoplay";
    stopImageViewTimer();
    stopVideoViewTimer();
  } else {
    ui.playButton.src = menuIcons.pause;
    ui.playButton.title = "Pause Autoplay";
    startViewTimer(currentThumb);
  }
  events.setVideoLooping(paused);
}

export function onVideoEnded(): void {
  if (!active || paused) {
    return;
  }

  if (videoViewTimer.isRunning) {
    events.onVideoEndedBeforeMinimumViewTime();
  } else {
    events.onComplete();
  }
}

function addAutoplayEventListeners(): void {
  imageViewTimer.onTimerEnd = (): void => {
    events.onComplete();
  };
  DomEvents.document.mousemove.on(throttle<MouseEvent>(() => {
    showMenu();
  }, 250), {
    signal: eventListenersAbortController.signal
  });
  DomEvents.document.keydown.on((event) => {
    if (!event.isHotkey) {
      return;
    }

    switch (event.key) {
      case "p":
        showMenu();
        pause();
        break;

      case " ":
        if (currentThumb !== null && !isVideo(currentThumb)) {
          showMenu();
          pause();
        }
        break;

      default:
        break;
    }
  }, {
    signal: eventListenersAbortController.signal
  });
}

function removeAutoplayEventListeners(): void {
  imageViewTimer.onTimerEnd = (): void => { };
  eventListenersAbortController.abort();
  eventListenersAbortController = new AbortController();
}

export function showMenu(): void {
  toggleMenuVisibility(true);
  menuVisibilityTimer.restart();
}

function hideMenu(): void {
  toggleMenuVisibility(false);
}

function forceHideMenu(): void {
  toggleMenuPersistence(false);
  toggleMenuVisibility(false);
  toggleSettingMenu(false);
}

function startImageProgressBar(): void {
  stopImageProgressBar();
  setTimeout(() => {
    ui.imageProgressBar.classList.add("animated");
  }, 20);
}

function stopImageProgressBar(): void {
  ui.imageProgressBar.classList.remove("animated");
  document.body.classList.remove("autoplay");
}

function startVideoProgressBar(): void {
  stopVideoProgressBar();
  setTimeout(() => {
    ui.videoProgressBar.classList.add("animated");
  }, 20);
}

function stopVideoProgressBar(): void {
  ui.videoProgressBar.classList.remove("animated");
}
