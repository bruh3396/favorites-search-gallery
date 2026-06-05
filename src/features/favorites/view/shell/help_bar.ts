import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { favoritesHelpLinks } from "@/features/favorites/types/scaffold";

const HELP_LINKS_CONTAINER_ID = "help-links-container";

export function setupFavoritesHelpBar(): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  const parent = document.getElementById("mobile-footer-header");

  if (parent === null) {
    return;
  }
  parent.appendChild(buildHelpLinks());
}

function buildHelpLinks(): HTMLElement {
  const container = document.createElement("span");

  container.id = HELP_LINKS_CONTAINER_ID;

  for (const link of favoritesHelpLinks) {
    const anchor = document.createElement("a");

    anchor.href = link.href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.label;
    container.appendChild(anchor);
  }
  return container;
}
