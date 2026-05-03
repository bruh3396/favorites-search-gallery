import { Overlays } from "../../../../lib/shell";

export function buildMobileFooter(): void {
  const status = document.getElementById("favorites-load-status");

  if (status === null) {
    return;
  }
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
  Overlays.appendChild(footer);
  footerTop.appendChild(status);
}
