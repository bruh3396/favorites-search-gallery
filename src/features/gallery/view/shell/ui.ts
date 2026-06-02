import * as Icons from "../../../../assets/icons";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "../../../../types/favorite";
import { clamp, roundToTwoDecimalPlaces } from "../../../../utils/number";
import { Preferences } from "../../../../app/context/preferences";
import { USING_FIREFOX } from "../../../../lib/environment";
import { blurActiveElement } from "../../../../utils/dom/interaction";
import { getLayout } from "../../../../app/layout/content_tiler";
import { insertStyle } from "../../../../utils/dom/injector";
import { showFullscreenIcon } from "../view_utils";
import { waitForAllThumbnailsToLoad } from "../../../../app/layout/content_thumbs";

const background: HTMLElement = document.createElement("div");

background.id = "gallery-background";
background.style.opacity = Preferences.backgroundOpacity.value;
let lastVisitedThumb: HTMLElement | null = null;

export function setup(root: HTMLElement): void {
  root.appendChild(background);
  toggleVideoPointerEvents(false);
  toggleGalleryMenuVisibility(false);
}

export function open(thumb: HTMLElement): void {
  setLastVisitedThumb(thumb);
  blurActiveElement();
  toggleCursor(true);
  toggleBackgroundInteractability(true);
  toggleScrollbar(false);
  toggleVideoPointerEvents(true);
  toggleGalleryMenuVisibility(true);
}

export function close(): void {
  toggleBackgroundInteractability(false);
  toggleScrollbar(true);
  scrollToLastVisitedThumb();
  toggleVideoPointerEvents(false);
  toggleCursor(true);
  toggleGalleryMenuVisibility(false);
  toggleZoomCursor(false);
}

export function scrollToLastVisitedThumb(): void {
  waitForAllThumbnailsToLoad()
    .then(() => {
      if (lastVisitedThumb !== null && usingColumnLayout()) {
        scrollToThumb(lastVisitedThumb);
      }
    });
}

export function toggleCursor(value: boolean): void {
  background.style.cursor = value ? "default" : "none";
}

export function toggleGalleryMenuVisibility(value: boolean): void {
  insertStyle(`
      #gallery-menu {
        display: ${value ? "flex" : "none"} !important;
      }
      `, "gallery-menu-visibility");
}

export function toggleZoomCursor(value: boolean): void {
  background.classList.toggle("gallery-background--zooming", value);
}

export function toggleBackgroundOpacity(): void {
  const opacity = parseFloat(background.style.opacity);

  if (opacity < 1) {
    setBackgroundOpacity(1);
  } else {
    setBackgroundOpacity(0);
  }
}

export function toggleScrollbar(value: boolean): void {
  document.body.style.overflowY = value ? "auto" : "hidden";
}

export function update(thumb: HTMLElement): void {
  setLastVisitedThumb(thumb);

  if (usingColumnLayout() || USING_FIREFOX) {
    return;
  }
  scrollToThumb(thumb);
}

export function updateBackgroundOpacity(event: WheelEvent): void {
  let opacity = parseFloat(Preferences.backgroundOpacity.value);

  opacity -= event.deltaY * 0.0005;
  opacity = clamp(opacity, 0, 1);
  setBackgroundOpacity(roundToTwoDecimalPlaces(opacity));
}

export function showAddedFavoriteStatus(status: AddFavoriteStatus): void {
  const icon = {
    [AddFavoriteStatus.AlreadyAdded]: Icons.HEART_CHECK,
    [AddFavoriteStatus.Success]: Icons.HEART_PLUS,
    [AddFavoriteStatus.Error]: Icons.ERROR,
    [AddFavoriteStatus.LoggedOut]: Icons.ERROR
  }[status] ?? Icons.ERROR;

  showFullscreenIcon(icon);
}

export function showRemovedFavoriteStatus(status: RemoveFavoriteStatus): void {
  switch (status) {
    case RemoveFavoriteStatus.Success:
      showFullscreenIcon(Icons.HEART_MINUS);
      break;

    case RemoveFavoriteStatus.Forbidden:
      showFullscreenIcon(Icons.WARNING, 1_000);
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

function usingColumnLayout(): boolean {
  return getLayout() === "tiler--column";
}

function setBackgroundOpacity(opacity: number): void {
  const opacityString = String(opacity);

  background.style.opacity = opacityString;
  Preferences.backgroundOpacity.set(opacityString);
}

function toggleVideoPointerEvents(value: boolean): void {
  insertStyle(`
      video {
        pointer-events: ${value ? "auto" : "none"}
      }
      `, "gallery-video-pointer-events");
}

function toggleBackgroundInteractability(value: boolean): void {
  background.classList.toggle("gallery-background--active", value);
}

function scrollToThumb(thumb: HTMLElement): void {
  thumb.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}
