import LIGHTBOX_CSS from "@/core/features/lightbox/styles.css?inline";
import UI_CSS from "@/core/ui/styles.css?inline";

export const POST_LIST_APP_STYLES = [UI_CSS, LIGHTBOX_CSS];

export interface PostListAppProps {
  grid: HTMLElement;
  lightboxView: HTMLElement;
}

export function PostListApp({ grid, lightboxView }: PostListAppProps): HTMLElement[] {
  return [grid, lightboxView];
}
