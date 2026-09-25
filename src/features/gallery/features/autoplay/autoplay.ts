import * as AutoplayMenu from "@/features/gallery/features/autoplay/menu";
import * as Icons from "@/assets/svg/icons";
import { clamp, toSeconds } from "@/utils/pure/number";
import { isImageThumb, isVideoThumb } from "@/lib/ui/thumb/media_item";
import { AppContext } from "@/app/context/context";
import { AutoplayMenuElements } from "@/features/gallery/features/autoplay/menu";
import { EnhancedKeyboardEvent } from "@/lib/event/input";
import { NavigationKey } from "@/types/input";
import { Timer } from "@/lib/async/scheduling";
import { createObjectUrlFromSvg } from "@/utils/browser/image";
import { insertStyle } from "@/utils/browser/injector";
import { throttle } from "@/lib/async/rate_limiting";

type Subscribe<E> = (callback: (event: E) => void, options?: AddEventListenerOptions) => void;

export type GalleryAutoplayEvents = {
  setVideoLooping: (value: boolean) => void;
  onComplete: (direction?: NavigationKey) => void;
  onVideoEndedBeforeMinimumViewTime: () => void;
  subscribeToMouseMove: Subscribe<MouseEvent>;
  subscribeToKeyDown: Subscribe<EnhancedKeyboardEvent>;
};

const menuIcons = {
  play: createObjectUrlFromSvg(Icons.PLAY),
  pause: createObjectUrlFromSvg(Icons.PAUSE),
  tune: createObjectUrlFromSvg(Icons.TUNE)
};

export class GalleryAutoplay {
  private readonly config: {
    imageViewDuration: number;
    minimumVideoDuration: number;
    menuVisibilityDuration: number;
    readonly imageViewDurationInSeconds: number;
    readonly minimumVideoDurationInSeconds: number;
  };

  private ui!: AutoplayMenuElements;
  private events!: GalleryAutoplayEvents;
  private eventListenersAbortController: AbortController;
  private currentThumb: HTMLElement | null;
  private imageViewTimer!: Timer;
  private menuVisibilityTimer!: Timer;
  private videoViewTimer!: Timer;
  private isActive: boolean;
  private isPaused: boolean;
  private isMenuPersistent: boolean;
  private isMenuVisible: boolean;

  constructor(private readonly context: AppContext) {
    const { preferences, environment } = this.context;

    this.config = {
      imageViewDuration: preferences.gallery.autoplayImageDuration.value,
      minimumVideoDuration: preferences.gallery.autoplayMinimumVideoDuration.value,
      menuVisibilityDuration: environment.onMobileDevice ? 1_500 : 1_000,

      get imageViewDurationInSeconds(): number {
        return toSeconds(this.imageViewDuration);
      },

      get minimumVideoDurationInSeconds(): number {
        return toSeconds(this.minimumVideoDuration);
      }
    };
    this.eventListenersAbortController = new AbortController();
    this.currentThumb = null;
    this.isActive = false;
    this.isPaused = false;
    this.isMenuPersistent = false;
    this.isMenuVisible = false;
  }

  public setup(inEvents: GalleryAutoplayEvents): void {
    this.initializeFields();
    this.initializeEvents(inEvents);
    this.initializeTimers();
    this.insertHtml();
    this.configureMobileUi();
    this.setMenuIconImageSources();
    this.addEventListeners();
    this.loadAutoplaySettingsIntoUi();
    inEvents.setVideoLooping(!this.isActive || this.isPaused);
  }

  public toggle(value: boolean): void {
    this.isActive = value;

    this.events.setVideoLooping(!value);
  }

  public startViewTimer(thumb: HTMLElement | null): void {
    if (thumb === null) {
      return;
    }
    this.currentThumb = thumb;

    if (!this.isActive || this.isPaused) {
      return;
    }

    if (isVideoThumb(thumb)) {
      this.startVideoViewTimer();
    } else {
      this.startImageViewTimer();
    }
  }

  public startAutoplay(): void {
    if (!this.isActive) {
      return;
    }
    this.addAutoplayEventListeners();
    this.ui.container.style.visibility = "visible";
    this.showMenu();
  }

  public stopAutoplay(): void {
    this.ui.container.style.visibility = "hidden";
    this.removeAutoplayEventListeners();
    this.stopImageViewTimer();
    this.stopVideoViewTimer();
    this.forceHideMenu();
  }

  public handleVideoEnded(): void {
    if (!this.isActive || this.isPaused) {
      return;
    }

    if (this.videoViewTimer.isRunning) {
      this.events.onVideoEndedBeforeMinimumViewTime();
    } else {
      this.events.onComplete();
    }
  }

  public showMenu(): void {
    this.toggleMenuVisibility(true);
    this.menuVisibilityTimer.restart();
  }

  private initializeFields(): void {
    this.eventListenersAbortController = new AbortController();
    this.currentThumb = null;
    this.isActive = this.context.preferences.gallery.autoplayActive.value;
    this.isPaused = this.context.preferences.gallery.autoplayPaused.value;
    this.isMenuPersistent = false;
    this.isMenuVisible = false;
  }

  private getDirection(): NavigationKey {
    return this.context.preferences.gallery.autoplayForward.value ? "ArrowRight" : "ArrowLeft";
  }

  private initializeEvents(inEvents: GalleryAutoplayEvents): void {
    this.events = inEvents;
    const onComplete = this.events.onComplete;

    this.events.onComplete = (): void => {
      if (this.isActive && !this.isPaused) {
        onComplete(this.getDirection());
      }
    };
  }

  private initializeTimers(): void {
    this.imageViewTimer = new Timer(this.config.imageViewDuration);
    this.menuVisibilityTimer = new Timer(this.config.menuVisibilityDuration);
    this.videoViewTimer = new Timer(this.config.minimumVideoDuration);

    this.imageViewTimer.onTimerEnd = (): void => { };
    this.menuVisibilityTimer.onTimerEnd = (): void => {
      if (this.isSettingsMenuOpen()) {
        this.menuVisibilityTimer.restart();
        return;
      }
      this.hideMenu();
      setTimeout(() => {
        if (!this.isMenuPersistent && !this.isMenuVisible) {
          this.toggleSettingMenu(false);
        }
      }, 100);
    };
  }

  private insertHtml(): void {
    this.insertMenu();
    this.insertImageProgressHtml();
    this.insertVideoProgressHtml();
  }

  private insertMenu(): void {
    this.ui = AutoplayMenu.build();
    this.context.shell.overlays.insertAdjacentElement("afterbegin", this.ui.container);
  }

  private insertImageProgressHtml(): void {
    insertStyle(`
      #autoplay-image-progress-bar.animated {
          transition: width ${this.config.imageViewDurationInSeconds}s linear;
          width: 100%;
      }

      body.autoplay::before {
        animation: progress ${this.config.imageViewDurationInSeconds}s linear forwards
      }
      `, "autoplay-image-progress");
  }

  private insertVideoProgressHtml(): void {
    insertStyle(`
      #autoplay-video-progress-bar.animated {
          transition: width ${this.config.minimumVideoDurationInSeconds}s linear;
          width: 100%;
      }
      `, "autoplay-video-progress");
  }

  private configureMobileUi(): void {
    if (this.context.environment.onDesktopDevice) {
      return;
    }
    this.createViewDurationSelects();
  }

  private createViewDurationSelects(): void {
    this.ui.settingsMenu.imageDurationInput = this.swapInputForSelect(this.ui.settingsMenu.imageDurationInput, this.createDurationSelect(1, 60), this.config.imageViewDurationInSeconds);
    this.ui.settingsMenu.minimumVideoDurationInput = this.swapInputForSelect(this.ui.settingsMenu.minimumVideoDurationInput, this.createDurationSelect(0, 60), this.config.minimumVideoDurationInSeconds);
  }

  private swapInputForSelect(input: HTMLElement, select: HTMLSelectElement, value: number): HTMLSelectElement {
    select.value = String(value);
    select.id = input.id;
    input.insertAdjacentElement("afterend", select);
    input.remove();
    return select;
  }

  private createDurationSelect(minimum: number, maximum: number): HTMLSelectElement {
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

  private setMenuIconImageSources(): void {
    this.ui.playButton.src = this.isPaused ? menuIcons.play : menuIcons.pause;
    this.ui.settingsButton.src = menuIcons.tune;
    this.ui.changeDirectionMask.container.classList.toggle("autoplay-direction-mask--upper-right", this.context.preferences.gallery.autoplayForward.value);
  }

  private loadAutoplaySettingsIntoUi(): void {
    this.ui.settingsMenu.imageDurationInput.value = String(this.config.imageViewDurationInSeconds);
    this.ui.settingsMenu.minimumVideoDurationInput.value = String(this.config.minimumVideoDurationInSeconds);
  }

  private addEventListeners(): void {
    this.addMenuEventListeners();
    this.addSettingsMenuEventListeners();
  }

  private addMenuEventListeners(): void {
    this.addDesktopMenuEventListeners();
    this.addMobileMenuEventListeners();
  }

  private addDesktopMenuEventListeners(): void {
    if (this.context.environment.onMobileDevice) {
      return;
    }
    this.ui.settingsButton.onclick = (): void => {
      this.toggleSettingMenu();
    };
    this.ui.playButton.onclick = (): void => {
      this.pause();
    };
    this.ui.changeDirectionButton.onclick = (): void => {
      this.toggleDirection();
    };
    this.ui.menu.onmouseenter = (): void => {
      this.toggleMenuPersistence(true);
    };
    this.ui.menu.onmouseleave = (): void => {
      this.toggleMenuPersistence(false);
    };
  }

  private addMobileMenuEventListeners(): void {
    if (this.context.environment.onDesktopDevice) {
      return;
    }
    this.ui.settingsButton.ontouchstart = (): void => {
      this.toggleSettingMenu();
      this.menuVisibilityTimer.restart();
    };
    this.ui.playButton.ontouchstart = (): void => {
      this.pause();
      this.menuVisibilityTimer.restart();
    };
    this.ui.changeDirectionButton.ontouchstart = (): void => {
      this.toggleDirection();
      this.menuVisibilityTimer.restart();
    };
  }

  private addSettingsMenuEventListeners(): void {
    this.ui.settingsMenu.imageDurationInput.onchange = (): void => {
      this.setImageViewDuration();

      if (this.currentThumb !== null && isImageThumb(this.currentThumb)) {
        this.startViewTimer(this.currentThumb);
      }
    };
    this.ui.settingsMenu.minimumVideoDurationInput.onchange = (): void => {
      this.setMinimumVideoViewDuration();

      if (this.currentThumb !== null && !isImageThumb(this.currentThumb)) {
        this.startViewTimer(this.currentThumb);
      }
    };
  }

  private toggleDirection(): void {
    this.context.preferences.gallery.autoplayForward.set(!this.context.preferences.gallery.autoplayForward.value);
    this.ui.changeDirectionMask.container.classList.toggle("autoplay-direction-mask--upper-right", this.context.preferences.gallery.autoplayForward.value);
  }

  private toggleMenuPersistence(value: boolean): void {
    this.isMenuPersistent = value;
    this.ui.menu.classList.toggle("gallery-menu--persistent", value);
  }

  private toggleMenuVisibility(value: boolean): void {
    this.isMenuVisible = value;
    this.ui.menu.classList.toggle("autoplay-menu--visible", value);
  }

  private isSettingsMenuOpen(): boolean {
    return this.ui.settingsMenu.container.classList.contains("autoplay-settings--visible");
  }

  private toggleSettingMenu(value?: boolean | undefined): void {
    if (value === undefined) {
      this.ui.settingsMenu.container.classList.toggle("autoplay-settings--visible");
      this.ui.settingsButton.classList.toggle("autoplay-settings-btn--open");
    } else {
      this.ui.settingsMenu.container.classList.toggle("autoplay-settings--visible", value);
      this.ui.settingsButton.classList.toggle("autoplay-settings-btn--open", value);
    }
  }

  private setImageViewDuration(): void {
    let durationInSeconds = parseFloat(this.ui.settingsMenu.imageDurationInput.value);

    if (isNaN(durationInSeconds)) {
      durationInSeconds = this.config.imageViewDurationInSeconds;
    }
    const duration = Math.round(clamp(durationInSeconds * 1_000, 1_000, 6_0000));

    this.context.preferences.gallery.autoplayImageDuration.set(duration);
    this.config.imageViewDuration = duration;
    this.imageViewTimer.waitTime = duration;
    this.ui.settingsMenu.imageDurationInput.value = String(this.config.imageViewDurationInSeconds);
    this.insertImageProgressHtml();
  }

  private setMinimumVideoViewDuration(): void {
    let durationInSeconds = parseFloat(this.ui.settingsMenu.minimumVideoDurationInput.value);

    if (isNaN(durationInSeconds)) {
      durationInSeconds = this.config.minimumVideoDurationInSeconds;
    }
    const duration = Math.round(clamp(durationInSeconds * 1_000, 0, 60_000));

    this.context.preferences.gallery.autoplayMinimumVideoDuration.set(duration);
    this.config.minimumVideoDuration = duration;
    this.videoViewTimer.waitTime = duration;
    this.ui.settingsMenu.minimumVideoDurationInput.value = String(this.config.minimumVideoDurationInSeconds);
    this.insertVideoProgressHtml();
  }

  private startImageViewTimer(): void {
    this.stopVideoProgressBar();
    this.stopVideoViewTimer();
    this.startImageProgressBar();
    this.imageViewTimer.restart();
  }

  private stopImageViewTimer(): void {
    this.imageViewTimer.stop();
    this.stopImageProgressBar();
  }

  private startVideoViewTimer(): void {
    this.stopImageViewTimer();
    this.stopImageProgressBar();
    this.startVideoProgressBar();
    this.videoViewTimer.restart();
  }

  private stopVideoViewTimer(): void {
    this.videoViewTimer.stop();
    this.stopVideoProgressBar();
  }

  private pause(): void {
    this.isPaused = !this.isPaused;
    this.context.preferences.gallery.autoplayPaused.set(this.isPaused);

    if (this.isPaused) {
      this.ui.playButton.src = menuIcons.play;
      this.ui.playButton.title = "Resume Autoplay";
      this.stopImageViewTimer();
      this.stopVideoViewTimer();
    } else {
      this.ui.playButton.src = menuIcons.pause;
      this.ui.playButton.title = "Pause Autoplay";
      this.startViewTimer(this.currentThumb);
    }
    this.events.setVideoLooping(this.isPaused);
  }

  private addAutoplayEventListeners(): void {
    this.imageViewTimer.onTimerEnd = (): void => {
      this.events.onComplete();
    };
    this.events.subscribeToMouseMove(throttle<MouseEvent>(() => {
      this.showMenu();
    }, 250), {
      signal: this.eventListenersAbortController.signal
    });
    this.events.subscribeToKeyDown((event) => {
      if (!event.isHotkey) {
        return;
      }

      switch (event.key) {
        case "p":
          this.showMenu();
          this.pause();
          break;

        case " ":
          if (this.currentThumb !== null && !isVideoThumb(this.currentThumb)) {
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
  }

  private removeAutoplayEventListeners(): void {
    this.imageViewTimer.onTimerEnd = (): void => { };
    this.eventListenersAbortController.abort();
    this.eventListenersAbortController = new AbortController();
  }

  private hideMenu(): void {
    this.toggleMenuVisibility(false);
  }

  private forceHideMenu(): void {
    this.toggleMenuPersistence(false);
    this.toggleMenuVisibility(false);
    this.toggleSettingMenu(false);
  }

  private startImageProgressBar(): void {
    this.stopImageProgressBar();
    setTimeout(() => {
      this.ui.imageProgressBar.classList.add("animated");
    }, 20);
  }

  private stopImageProgressBar(): void {
    this.ui.imageProgressBar.classList.remove("animated");
    document.body.classList.remove("autoplay");
  }

  private startVideoProgressBar(): void {
    this.stopVideoProgressBar();
    setTimeout(() => {
      this.ui.videoProgressBar.classList.add("animated");
    }, 20);
  }

  private stopVideoProgressBar(): void {
    this.ui.videoProgressBar.classList.remove("animated");
  }
}
