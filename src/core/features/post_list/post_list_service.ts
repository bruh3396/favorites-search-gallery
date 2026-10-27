import { Readable, Signal } from "@/core/utils/reactive/signal";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Media } from "@/core/domain/media/media";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { Post } from "@/core/domain/post/post";
import { PostListPage } from "@/core/domain/post_list/post_list_page";
import { RemotePostList } from "@/core/boundary/ports/remote_post_list/remote_post_list";

export interface PostListServiceDependencies {
  remotePostList: RemotePostList;
}

export interface PostListService {
  readonly page: Readable<PostListPage>;
  readonly changed: Occurrence<Post>;
  showPage(index: number): Promise<void>;
  correctMedia(postId: string, media: Media): void;
}

export function createPostListService(dependencies: PostListServiceDependencies): PostListService {
  const page = new Signal(dependencies.remotePostList.readInitialPage());
  const changed = new Emitter<Post>();
  return {
    page,
    changed,
    showPage: async(index): Promise<void> => {
      page.value = await dependencies.remotePostList.fetchPage(index);
    },
    correctMedia: (postId, media): void => {
      const current = page.peek();
      const post = current.posts.find(candidate => candidate.id === postId);

      if (post === undefined) {
        return;
      }
      const corrected = { ...post, media };

      page.value = { ...current, posts: current.posts.map(candidate => (candidate === post ? corrected : candidate)) };
      changed.emit(corrected);
    }
  };
}
