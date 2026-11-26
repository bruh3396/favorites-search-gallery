export interface PostListAppProps {
  grid: HTMLElement;
  lightboxView: HTMLElement;
}

export function PostListApp({ grid, lightboxView }: PostListAppProps): HTMLElement[] {
  return [grid, lightboxView];
}
