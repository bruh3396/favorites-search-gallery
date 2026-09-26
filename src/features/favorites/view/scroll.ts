export function scrollToContentTop(onMobileDevice: boolean): void {
  window.scrollTo(0, onMobileDevice ? 10 : 0);
}
