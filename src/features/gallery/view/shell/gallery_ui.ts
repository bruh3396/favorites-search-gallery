import * as Icons from "../../../../assets/icons";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "../../../../types/favorite";
import { clamp, roundToTwoDecimalPlaces } from "../../../../utils/number";
import { GALLERY_ROOT } from "./gallery_shell";
import { Preferences } from "../../../../lib/preferences/preferences";
import { USING_FIREFOX } from "../../../../lib/environment/environment";
import { blurActiveElement } from "../../../../utils/dom/interaction";
import { insertStyle } from "../../../../utils/dom/injector";
import { showFullscreenIcon } from "../gallery_view_utils";
import { waitForAllThumbnailsToLoad } from "../../../../lib/dom/content_thumb";

const BACKGROUND: HTMLElement = document.createElement("div");

BACKGROUND.id = "gallery-background";
BACKGROUND.style.opacity = Preferences.backgroundOpacity.value;
let lastVisitedThumb: HTMLElement | null = null;

function usingColumnLayout(): boolean {
  return document.querySelector("#favorites-search-gallery-content.column") !== null;
}

export function setupGalleryUI(): void {
  GALLERY_ROOT.appendChild(BACKGROUND);
  toggleVideoPointerEvents(false);
  toggleGalleryMenuVisibility(false);
}

export function enterGallery(thumb: HTMLElement): void {
  setLastVisitedThumb(thumb);
  blurActiveElement();
  toggleCursor(true);
  toggleBackgroundInteractability(true);
  toggleScrollbar(false);
  toggleVideoPointerEvents(true);
  toggleGalleryMenuVisibility(true);
}

export function exitGallery(): void {
  toggleBackgroundInteractability(false);
  toggleScrollbar(true);
  scrollToLastVisitedThumb();
  toggleVideoPointerEvents(false);
  toggleCursor(true);
  toggleGalleryMenuVisibility(false);
}

export function scrollToLastVisitedThumb(): void {
  waitForAllThumbnailsToLoad()
    .then(() => {
      if (lastVisitedThumb !== null && usingColumnLayout()) {
        scrollToThumb(lastVisitedThumb);
      }
    });
}

function toggleVideoPointerEvents(value: boolean): void {
  insertStyle(`
      video {
        pointer-events: ${value ? "auto" : "none"}
      }
      `, "video-pointer-events");
}

function toggleBackgroundInteractability(value: boolean): void {
    BACKGROUND.classList.toggle("in-gallery", value);
}

export function toggleBackgroundOpacity(): void {
  const opacity = parseFloat(BACKGROUND.style.opacity);

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

export function updateUiInGallery(thumb: HTMLElement): void {
  setLastVisitedThumb(thumb);

  if (usingColumnLayout() || USING_FIREFOX) {
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

  BACKGROUND.style.opacity = opacityString;
  Preferences.backgroundOpacity.set(opacityString);
}

export function showAddedFavoriteStatus(status: AddFavoriteStatus): void {
  const icon = {
    [AddFavoriteStatus.ALREADY_ADDED]: Icons.HEART_CHECK,
    [AddFavoriteStatus.SUCCESSFULLY_ADDED]: Icons.HEART_PLUS,
    [AddFavoriteStatus.ERROR]: Icons.ERROR,
    [AddFavoriteStatus.NOT_LOGGED_IN]: Icons.ERROR
  }[status] ?? Icons.ERROR;

  showFullscreenIcon(icon);
}

export function showRemovedFavoriteStatus(status: RemoveFavoriteStatus): void {
  switch (status) {
    case RemoveFavoriteStatus.SUCCESSFULLY_REMOVED:
      showFullscreenIcon(Icons.HEART_MINUS);
      break;

    case RemoveFavoriteStatus.FORBIDDEN:
      showFullscreenIcon(Icons.WARNING, 1000);
      setTimeout(() => {
        alert("The \"Remove Buttons\" option must be checked to use this hotkey");
      }, 20);
      break;

    default:
      break;
  }
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
  BACKGROUND.style.cursor = value ? "default" : "none";
}

export function toggleGalleryMenuVisibility(value: boolean): void {
  insertStyle(`
      #gallery-menu {
        display: ${value ? "flex" : "none"} !important;
      }
      `, "gallery-menu-visibility");
}

export function toggleZoomCursor(value: boolean): void {
  BACKGROUND.classList.toggle("zooming", value);
}
