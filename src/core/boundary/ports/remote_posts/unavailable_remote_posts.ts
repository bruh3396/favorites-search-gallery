import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { Post } from "@/core/domain/post/post";
import { PostUnavailableError } from "@/core/boundary/ports/remote_posts/post_unavailable_error";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";

export class UnavailableRemotePosts implements RemotePosts {
  public fetch(post: Readonly<Pick<Post, "id" | "status">>): Promise<CategorizedPost> {
    return Promise.reject(new PostUnavailableError(post.id));
  }
}
