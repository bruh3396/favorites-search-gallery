import * as AutoplayMenu from "@/features/gallery/features/autoplay/menu";
import * as Icons from "@/assets/icons";
import { EnhancedKeyboardEvent, NavigationKey } from "@/types/input";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { clamp, millisecondsToSeconds } from "@/utils/number";
import { isImageThumb, isVideoThumb } from "@/lib/media/type_predicates";
import AUTOPLAY_CSS from "@/assets/css/gallery/autoplay.css";
import { AutoplayMenuElements } from "@/features/gallery/features/autoplay/menu";
import { Overlays } from "@/app/layout/shell";
import { Preferences } from "@/app/context/preferences";
import { Timer } from "@/lib/async/timer";
import { createObjectUrlFromSvg } from "@/utils/dom/svg";
import { insertStyle } from "@/utils/dom/injector";
import { throttle } from "@/lib/async/throttle";

type Subscribe<E> = (callback: (event: E) => void, options?: AddEventListenerOptions) => void;

type AutoplayEvents = {
  setVideoLooping: (value: boolean) => void
  onComplete: (direction?: NavigationKey) => void
  onVideoEndedBeforeMinimumViewTime: () => void
  subscribeToMouseMove: Subscribe<MouseEvent>
  subscribeToKeyDown: Subscribe<EnhancedKeyboardEvent>
}

const menuIcons = {
  play: createObjectUrlFromSvg(Icons.PLAY),
  pause: createObjectUrlFromSvg(Icons.PAUSE),
  tune: createObjectUrlFromSvg(Icons.TUNE)
};

const config = {
  imageViewDuration: Preferences.gallery.autoplayImageDuration.value,
  minimumVideoDuration: Preferences.gallery.autoplayMinimumVideoDuration.value,
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
  setMenuIconImageSources();
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
  eventListenersAbortController = new AbortController();
  currentThumb = null;
  active = Preferences.gallery.autoplayActive.value;
  paused = Preferences.gallery.autoplayPaused.value;
  menuIsPersistent = false;
  menuIsVisible = false;
}

function getDirection(): NavigationKey {
  return Preferences.gallery.autoplayForward.value ? "ArrowRight" : "ArrowLeft";
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
  ui = AutoplayMenu.build();
  Overlays.insertAdjacentElement("afterbegin", ui.container);
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

function configureMobileUi(): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  createViewDurationSelects();
}

function createViewDurationSelects(): void {
  ui.settingsMenu.imageDurationInput = swapInputForSelect(ui.settingsMenu.imageDurationInput, createDurationSelect(1, 60), config.imageViewDurationInSeconds);
  ui.settingsMenu.minimumVideoDurationInput = swapInputForSelect(ui.settingsMenu.minimumVideoDurationInput, createDurationSelect(0, 60), config.minimumVideoDurationInSeconds);
}

function swapInputForSelect(input: HTMLElement, select: HTMLSelectElement, value: number): HTMLSelectElement {
  select.value = String(value);
  select.id = input.id;
  input.insertAdjacentElement("afterend", select);
  input.remove();
  return select;
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
  ui.changeDirectionMask.container.classList.toggle("autoplay-direction-mask--upper-right", Preferences.gallery.autoplayForward.value);
}

function loadAutoplaySettingsIntoUi(): void {
  ui.settingsMenu.imageDurationInput.value = String(config.imageViewDurationInSeconds);
  ui.settingsMenu.minimumVideoDurationInput.value = String(config.minimumVideoDurationInSeconds);
}

function addEventListeners(): void {
  addMenuEventListeners();
  addSettingsMenuEventListeners();
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

    if (currentThumb !== null && isImageThumb(currentThumb)) {
      startViewTimer(currentThumb);
    }
  };
  ui.settingsMenu.minimumVideoDurationInput.onchange = (): void => {
    setMinimumVideoViewDuration();

    if (currentThumb !== null && !isImageThumb(currentThumb)) {
      startViewTimer(currentThumb);
    }
  };
}

function toggleDirection(): void {
  Preferences.gallery.autoplayForward.set(!Preferences.gallery.autoplayForward.value);
  ui.changeDirectionMask.container.classList.toggle("autoplay-direction-mask--upper-right", Preferences.gallery.autoplayForward.value);
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

export function toggle(value: boolean): void {
  active = value;

  events.setVideoLooping(!value);
}

function setImageViewDuration(): void {
  let durationInSeconds = parseFloat(ui.settingsMenu.imageDurationInput.value);

  if (isNaN(durationInSeconds)) {
    durationInSeconds = config.imageViewDurationInSeconds;
  }
  const duration = Math.round(clamp(durationInSeconds * 1_000, 1_000, 6_0000));

  Preferences.gallery.autoplayImageDuration.set(duration);
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

  Preferences.gallery.autoplayMinimumVideoDuration.set(duration);
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

  if (isVideoThumb(thumb)) {
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
  Preferences.gallery.autoplayPaused.set(paused);

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
  events.subscribeToMouseMove(throttle<MouseEvent>(() => {
    showMenu();
  }, 250), {
    signal: eventListenersAbortController.signal
  });
  events.subscribeToKeyDown((event) => {
    if (!event.isHotkey) {
      return;
    }

    switch (event.key) {
      case "p":
        showMenu();
        pause();
        break;

      case " ":
        if (currentThumb !== null && !isVideoThumb(currentThumb)) {
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
