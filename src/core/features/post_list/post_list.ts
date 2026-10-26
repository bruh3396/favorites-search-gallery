import { Emitter } from "@/core/utils/reactive/emitter";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { RemoteSearchResults, SearchResultsPage } from "@/core/boundary/ports/remote_search_results/remote_search_results";
import { Media } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";

export interface PostListDependencies {
  remoteSearchResults: RemoteSearchResults;
}

export interface PostListService {
  readonly page: Readable<SearchResultsPage>;
  readonly changed: Occurrence<Post>;
  showPage(index: number): Promise<void>;
  correctMedia(id: string, media: Media): void;
}

export function createPostListService(dependencies: PostListDependencies): PostListService {
  const page = new Signal(dependencies.remoteSearchResults.readInitialPage());
  const changed = new Emitter<Post>();
  return {
    page,
    changed,
    showPage: async(index): Promise<void> => {
      page.value = await dependencies.remoteSearchResults.fetchPage(index);
    },
    correctMedia: (id, media): void => {
      const current = page.peek();
      const post = current.posts.find(candidate => candidate.id === id);

      if (post === undefined) {
        return;
      }
      const corrected = { ...post, media };

      page.value = { ...current, posts: current.posts.map(candidate => (candidate === post ? corrected : candidate)) };
      changed.emit(corrected);
    }
  };
}
