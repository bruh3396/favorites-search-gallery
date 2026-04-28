export function overGalleryMenu(event: MouseEvent): boolean {
  if (!(event.target instanceof HTMLElement)) {
    return false;
  }
  return event.target.classList.contains(".gallery-sub-menu") || event.target.closest(".gallery-sub-menu") !== null;
}

export function showFullscreenIcon(svg: string, duration: number = 500): void {
  const svgDocument = new DOMParser().parseFromString(svg, "image/svg+xml");
  const svgElement = svgDocument.documentElement;
  const svgOverlay = document.createElement("div");

  svgOverlay.classList.add("fullscreen-icon");
  svgOverlay.innerHTML = new XMLSerializer().serializeToString(svgElement);
  document.body.appendChild(svgOverlay);
  setTimeout(() => {
    svgOverlay.remove();
  }, duration);
}
