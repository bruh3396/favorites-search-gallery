import * as Icons from "@/assets/icons";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { clamp, roundToTwoDecimalPlaces } from "@/utils/number";
import { Preferences } from "@/app/context/preferences";
import { USING_FIREFOX } from "@/lib/environment";
import { blurActiveElement } from "@/utils/dom/interaction";
import { div } from "@/utils/dom/element";
import { getLayout } from "@/app/layout/content_tiler";
import { insertStyle } from "@/utils/dom/injector";
import { showFullscreenIcon } from "@/features/gallery/dom_tweaks/fullscreen_icon";
import { waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";

const background: HTMLDivElement = div("gallery-background");

background.style.opacity = Preferences.gallery.backgroundOpacity.value;
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
  waitForAllThumbsToLoad()
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
  let opacity = parseFloat(Preferences.gallery.backgroundOpacity.value);

  opacity -= event.deltaY * 0.0005;
  opacity = clamp(opacity, 0, 1);
  setBackgroundOpacity(roundToTwoDecimalPlaces(opacity));
}

export function showAddedFavoriteStatus(status: AddFavoriteStatus): void {
  const icon = {
    alreadyAdded: Icons.HEART_CHECK,
    success: Icons.HEART_PLUS,
    error: Icons.ERROR,
    loggedOut: Icons.ERROR
  }[status] ?? Icons.ERROR;

  showFullscreenIcon(icon);
}

export function showRemovedFavoriteStatus(status: RemoveFavoriteStatus): void {
  switch (status) {
    case "success":
      showFullscreenIcon(Icons.HEART_MINUS);
      break;

    case "forbidden":
      showFullscreenIcon(Icons.WARNING, 1_000);
      setTimeout(() => {
        alert("Removing favorites from the gallery is currently disabled.");
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
  return getLayout() === "column";
}

function setBackgroundOpacity(opacity: number): void {
  const opacityString = String(opacity);

  background.style.opacity = opacityString;
  Preferences.gallery.backgroundOpacity.set(opacityString);
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
