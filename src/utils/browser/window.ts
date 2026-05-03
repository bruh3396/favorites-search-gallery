export function toggleFullscreen(): void {
  if (document.fullscreenElement === null) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

export function reloadWindow(): void {
  window.location.reload();
}

export function setSiteTitle(title: string): void {
  document.title = title;
}
