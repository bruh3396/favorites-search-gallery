export function overGalleryMenu(event: MouseEvent): boolean {
  if (!(event.target instanceof Element)) {
    return false;
  }
  return event.target.closest(".gallery-sub-menu") !== null;
}
