import { div, img, numberInput } from "@/utils/dom/element";

export type AutoplayMenuElements = {
  container: HTMLElement
  menu: HTMLElement
  settingsButton: HTMLImageElement
  settingsMenu: {
    container: HTMLElement
    imageDurationInput: HTMLInputElement | HTMLSelectElement
    minimumVideoDurationInput: HTMLInputElement | HTMLSelectElement
  }
  playButton: HTMLImageElement
  changeDirectionButton: HTMLImageElement
  changeDirectionMask: {
    container: HTMLElement
    image: HTMLImageElement
  }
  imageProgressBar: HTMLElement
  videoProgressBar: HTMLElement
};

export function build(): AutoplayMenuElements {
  const container = div("autoplay-container");
  const menu = div("autoplay-menu");
  const buttons = div("autoplay-buttons");
  const settingsButton = img("autoplay-settings-button");
  const playButton = img("autoplay-play-button");
  const changeDirectionButton = img("autoplay-change-direction-button");
  const maskContainer = div("autoplay-change-direction-mask-container");
  const maskImage = img("autoplay-change-direction-mask");
  const imageProgressBar = div("autoplay-image-progress-bar");
  const videoProgressBar = div("autoplay-video-progress-bar");

  const settingsMenu = div("autoplay-settings-menu");
  const imageDuration = buildDurationRow("autoplay-image-duration-input", "Image/GIF Duration", 1, 60);
  const minimumVideoDuration = buildDurationRow("autoplay-minimum-animated-duration-input", "Minimum Video Duration", 0, 60);

  menu.className = "u-no-select gallery-sub-menu";
  settingsButton.title = "Autoplay settings";
  playButton.title = "Pause autoplay";
  changeDirectionButton.title = "Change autoplay direction";
  maskImage.title = "Change autoplay direction";
  imageProgressBar.className = "autoplay-progress-bar";
  videoProgressBar.className = "autoplay-progress-bar";

  maskContainer.append(maskImage);
  buttons.append(settingsButton, playButton, changeDirectionButton, maskContainer);
  settingsMenu.append(imageDuration.row, minimumVideoDuration.row);
  menu.append(buttons, imageProgressBar, videoProgressBar, settingsMenu);
  container.append(menu);
  return {
    container,
    menu,
    settingsButton,
    settingsMenu: {
      container: settingsMenu,
      imageDurationInput: imageDuration.input,
      minimumVideoDurationInput: minimumVideoDuration.input
    },
    playButton,
    changeDirectionButton,
    changeDirectionMask: {
      container: maskContainer,
      image: maskImage
    },
    imageProgressBar,
    videoProgressBar
  };
}

function buildDurationRow(inputId: string, text: string, min: number, max: number): { row: HTMLElement; input: HTMLInputElement } {
  const row = document.createElement("div");
  const rowLabel = document.createElement("label");
  const input = numberInput(inputId, min, max, 1);

  rowLabel.htmlFor = inputId;
  rowLabel.textContent = text;
  row.append(rowLabel, input);
  return { row, input };
}
