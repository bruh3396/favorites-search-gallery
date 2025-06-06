import { ON_FAVORITES_PAGE, USING_FIREFOX } from "../../../../lib/globals/flags";
import { clamp, roundToTwoDecimalPlaces } from "../../../../utils/primitive/number";
import { GALLERY_CONTAINER } from "./gallery_container";
import { Preferences } from "../../../../store/local_storage/preferences";
import { insertStyleHTML } from "../../../../utils/dom/style";
import { waitForAllThumbnailsToLoad } from "../../../../utils/dom/dom";

const background: HTMLElement = document.createElement("div");

background.id = "gallery-background";
background.style.opacity = Preferences.backgroundOpacity.value;
let lastVisitedThumb: HTMLElement | null = null;

function isUsingColumnLayout(): boolean {
  return ON_FAVORITES_PAGE && document.querySelector("#favorites-search-gallery-content.column") !== null;
}

export function setupGalleryUI(): void {
  GALLERY_CONTAINER.appendChild(background);
  toggleVideoPointerEvents(false);
  toggleMenu(false);
}

export function enterGallery(thumb: HTMLElement): void {
  setLastVisitedThumb(thumb);
  toggleBackgroundInteractability(true);
  toggleScrollbar(false);
  toggleVideoPointerEvents(true);
  toggleMenu(true);
}

export function exitGallery(): void {
  toggleBackgroundInteractability(false);
  toggleScrollbar(true);
  scrollToLastVisitedThumb();
  toggleVideoPointerEvents(false);
  toggleCursor(true);
  toggleMenu(false);
}

export function scrollToLastVisitedThumb(): void {
  waitForAllThumbnailsToLoad()
    .then(() => {
      if (lastVisitedThumb !== null && isUsingColumnLayout()) {
        scrollToThumb(lastVisitedThumb);
      }
    });
}

function toggleVideoPointerEvents(value: boolean): void {
  insertStyleHTML(`
      video {
        pointer-events: ${value ? "auto" : "none"}
      }
      `, "video-pointer-events");
}

function toggleBackgroundInteractability(value: boolean): void {
  background.classList.toggle("in-gallery", value);
}

export function toggleBackgroundOpacity(): void {
  const opacity = parseFloat(background.style.opacity);

  if (opacity < 1) {
    updateBackgroundOpacity(1);
  } else {
    updateBackgroundOpacity(0);
  }
}

export function show(): void {
  toggleScrollbar(false);
}

export function hide(): void {
  toggleScrollbar(true);
}

function toggleScrollbar(value: boolean): void {
  document.body.style.overflowY = value ? "auto" : "hidden";
}

export function updateUIInGallery(thumb: HTMLElement): void {
  setLastVisitedThumb(thumb);

  if (isUsingColumnLayout() || USING_FIREFOX) {
    return;
  }
  scrollToThumb(thumb);
}

export function updateBackgroundOpacityFromEvent(event: WheelEvent): void {
  let opacity = parseFloat(Preferences.backgroundOpacity.value);

  opacity -= event.deltaY * 0.0005;
  opacity = clamp(opacity, 0, 1);
  updateBackgroundOpacity(roundToTwoDecimalPlaces(opacity));
}

function updateBackgroundOpacity(opacity: number): void {
  const opacityString = String(opacity);

  background.style.opacity = opacityString;
  Preferences.backgroundOpacity.set(opacityString);
}

export function showAddedFavoriteStatus(status: number): void {
  // const icon = {
  //   [Utils.addedFavoriteStatuses.alreadyAdded]: SVGIcons.heartCheck,
  //   [Utils.addedFavoriteStatuses.success]: SVGIcons.heartPlus
  // }[status] || SVGIcons.error;

  // showFullscreenIcon(icon);
}

export function showRemovedFavoriteStatus(status: number): void {
  // switch (status) {
  //   case Utils.removedFavoriteStatuses.success:
  //     Utils.showFullscreenIcon(SVGIcons.heartMinus);
  //     break;

  //   case Utils.removedFavoriteStatuses.removeNotAllowed:
  //     Utils.showFullscreenIcon(SVGIcons.warning, 1000);
  //     setTimeout(() => {
  //       alert("The \"Remove Buttons\" option must be checked to use this hotkey");
  //     }, 20);
  //     break;

  //   default:
  //     break;
  // }
}

export function setLastVisitedThumb(thumb: HTMLElement): void {
  lastVisitedThumb = thumb;
}

function scrollToThumb(thumb: HTMLElement): void {
  thumb.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

export function toggleCursor(value: boolean): void {
  background.style.cursor = value ? "default" : "none";
}

export function toggleMenu(value: boolean): void {
  insertStyleHTML(`
      #gallery-menu {
        display: ${value ? "flex" : "none"} !important;
      }
      `, "gallery-menu-visibility");
}

export function toggleZoomCursor(value: boolean): void {
  background.classList.toggle("zooming", value);
}
