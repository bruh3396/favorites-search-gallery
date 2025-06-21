import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../../../lib/global/container";

export function createFooter(): void {
  const footer = document.createElement("div");
  const footerHeader = document.createElement("div");
  const footerTop = document.createElement("div");
  const footerBottom = document.createElement("div");

  footer.id = "mobile-footer";
  footerHeader.id = "mobile-footer-header";
  footerTop.id = "mobile-footer-top";
  footerBottom.id = "mobile-footer-bottom";

  footer.className = "dark-green-gradient";
  footer.appendChild(footerHeader);
  footer.appendChild(footerTop);
  footer.appendChild(footerBottom);

  FAVORITES_SEARCH_GALLERY_CONTAINER.appendChild(footer);
}

export function moveStatusToFooter(): void {
  const status = document.getElementById("favorites-load-status");
  const footerTop = document.getElementById("mobile-footer-top");

  if (status === null || footerTop === null) {
    return;
  }
  footerTop.appendChild(status);
}
