import { Lightbox } from "@/core/features/lightbox/lightbox";
import LIGHTBOX_CSS from "@/core/features/lightbox/styles.css?inline";
import { PostGrid, PostGridProps } from "@/core/ui/post_grid/post_grid";
import { Post } from "@/core/domain/post/post";
import { Readable } from "@/core/utils/reactive/signal";
import UI_CSS from "@/core/ui/styles.css?inline";
import { h } from "@/core/ui/h/h";

export const POST_LIST_APP_STYLES = [UI_CSS, LIGHTBOX_CSS];

export interface PostListAppProps {
  posts: Readable<readonly Post[]>;
  postGridProps: Omit<PostGridProps<Post>, "posts">;
  lightbox: Lightbox<Post>;
}

export function PostListApp({ posts, postGridProps, lightbox }: PostListAppProps): HTMLElement[] {
  return [
    <PostGrid<Post> {...postGridProps} posts={posts} />,
    lightbox.createView()
  ];
}
