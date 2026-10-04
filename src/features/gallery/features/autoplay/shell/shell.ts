import { AutoplayAction, AutoplayDuration } from "@/features/gallery/features/autoplay/types/types";
import { IconName, icon } from "@/lib/ui/icon";
import { createElement, numberInput } from "@/utils/browser/element";
import { AutoplayConfig } from "@/config/autoplay_config";
import { Device } from "@/core/boundary/environment";

type DurationField = HTMLInputElement | HTMLSelectElement;

const DURATION_FIELDS: Record<AutoplayDuration, { id: string; label: string }> = {
  image: { id: "autoplay-image-duration-input", label: "Image/GIF Duration" },
  minimumVideo: { id: "autoplay-minimum-animated-duration-input", label: "Minimum Video Duration" }
};

const FIELD_BUILDERS: Record<Device, (kind: AutoplayDuration) => DurationField> = {
  desktop: numberField,
  mobile: selectField
};

export class AutoplayShell {
  public readonly container: HTMLElement;
  public readonly menu: HTMLElement;
  public readonly buttons: HTMLElement;
  public readonly settingsButton: HTMLImageElement;
  public readonly playButton: HTMLImageElement;
  public readonly directionButton: HTMLElement;
  public readonly directionMask: HTMLElement;
  public readonly progressBars: Record<AutoplayDuration, HTMLElement>;
  public readonly settingsMenu: HTMLElement;
  public readonly durationFields: Record<AutoplayDuration, DurationField>;

  constructor(platform: Device) {
    this.settingsButton = button(createElement("img", { id: "autoplay-settings-button" }), "toggleSettings", "Autoplay settings");
    this.playButton = button(createElement("img", { id: "autoplay-play-button" }), "togglePause", "Pause autoplay");
    this.directionMask = createElement("div", {
      id: "autoplay-change-direction-mask-container",
      children: [iconWithId("changeDirectionMask", "autoplay-change-direction-mask")]
    });
    const directionSlot = createElement("div", {
      id: "autoplay-change-direction-slot",
      children: [iconWithId("changeDirection", "autoplay-change-direction-button"), this.directionMask]
    });

    this.directionButton = button(directionSlot, "toggleDirection", "Change autoplay direction");
    this.buttons = createElement("div", { id: "autoplay-buttons", children: [this.settingsButton, this.playButton, this.directionButton] });
    this.progressBars = {
      image: createElement("div", { id: "autoplay-image-progress-bar", className: "autoplay-progress-bar" }),
      minimumVideo: createElement("div", { id: "autoplay-video-progress-bar", className: "autoplay-progress-bar" })
    };
    this.durationFields = { image: FIELD_BUILDERS[platform]("image"), minimumVideo: FIELD_BUILDERS[platform]("minimumVideo") };
    this.settingsMenu = createElement("div", {
      id: "autoplay-settings-menu",
      children: [row("image", this.durationFields.image), row("minimumVideo", this.durationFields.minimumVideo)]
    });
    this.menu = createElement("div", {
      id: "autoplay-menu",
      className: "u-no-select gallery-sub-menu",
      children: [this.buttons, this.progressBars.image, this.progressBars.minimumVideo, this.settingsMenu]
    });
    this.container = createElement("div", { id: "autoplay-container", children: [this.menu] });
  }
}

function button<E extends HTMLElement>(element: E, action: AutoplayAction, title: string): E {
  element.title = title;
  element.dataset.autoplayAction = action;
  return element;
}

function iconWithId(name: IconName, id: string): SVGElement {
  const element = icon(name);

  element.id = id;
  return element;
}

function row(kind: AutoplayDuration, field: DurationField): HTMLElement {
  const label = createElement("label", { textContent: DURATION_FIELDS[kind].label });

  label.htmlFor = DURATION_FIELDS[kind].id;
  field.dataset.autoplayDuration = kind;
  return createElement("div", { children: [label, field] });
}

function numberField(kind: AutoplayDuration): HTMLInputElement {
  const { min, max } = AutoplayConfig.durationSeconds[kind];
  return numberInput(DURATION_FIELDS[kind].id, { min, max, step: 1 });
}

function selectField(kind: AutoplayDuration): HTMLSelectElement {
  const options = AutoplayConfig.durationSeconds[kind].options.map(seconds => createElement("option", { textContent: String(seconds) }));
  return createElement("select", { id: DURATION_FIELDS[kind].id, children: options });
}
