import { CategorizedPost, Post } from "@/core/domain/post/post";
import { CoalescingExecutor } from "@/core/utils/async/coalescing";
import { LocalPosts } from "@/core/boundary/ports/local_posts";
import { PostLibrary } from "@/features/favorites/types/types";
import { RemoteMedia } from "@/core/boundary/ports/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler";

const WRITE_BATCH_SIZE = 25;
const WRITE_DELAY = 2_000;
const TIME_TO_LIVE = 28 * 24 * 60 * 60 * 1_000;

function postIsComplete(post: Post): boolean {
  return post.width > 0 && post.height > 0;
}

function postIsStale(post: Post, now: number): boolean {
  return post.fetchedAt === undefined || now - post.fetchedAt > TIME_TO_LIVE;
}

interface FavoritesPostLibraryDependencies {
  localPosts: LocalPosts;
  remotePosts: RemotePosts;
  remoteMedia: Pick<RemoteMedia, "fetchDurationSeconds">;
  scheduler: Scheduler;
  onRefreshed: (updated: CategorizedPost) => void;
}

export class FavoritesPostLibrary implements PostLibrary {
  private readonly localPosts: LocalPosts;
  private readonly remotePosts: RemotePosts;
  private readonly remoteMedia: Pick<RemoteMedia, "fetchDurationSeconds">;
  private readonly scheduler: Scheduler;
  private readonly localPostsWriter: CoalescingExecutor<Post>;
  private readonly onRefreshed: (updated: CategorizedPost) => void;

  constructor(dependencies: FavoritesPostLibraryDependencies) {
    this.localPosts = dependencies.localPosts;
    this.remotePosts = dependencies.remotePosts;
    this.remoteMedia = dependencies.remoteMedia;
    this.scheduler = dependencies.scheduler;
    this.localPostsWriter = new CoalescingExecutor(WRITE_BATCH_SIZE, WRITE_DELAY, posts => this.localPosts.setMany(posts), dependencies.scheduler);
    this.onRefreshed = dependencies.onRefreshed;
  }

  public async streamAll(ids: string[], batchSize: number, onBatch: (posts: Post[]) => void): Promise<void> {
    for (let i = 0; i < ids.length; i += batchSize) {
      onBatch(await this.localPosts.getMany(ids.slice(i, i + batchSize)));
    }
  }

  public storeMissing(posts: Post[]): Promise<void> {
    return this.localPosts.setManyIfAbsent(posts);
  }

  public async refreshAll(posts: Post[]): Promise<void> {
    await Promise.all(posts.map(post => this.refresh(post)));
  }

  private async refresh(post: Post): Promise<void> {
    const { post: current, tagCategories } = await this.refreshStale(post);
    const refreshed = await this.fillDuration(current);

    if (refreshed === post) {
      return;
    }

    if (postIsComplete(refreshed)) {
      this.localPostsWriter.schedule(refreshed);
    }
    this.onRefreshed({ post: refreshed, tagCategories });
  }

  private refreshStale(post: Post): Promise<CategorizedPost> {
    const unchanged = { post, tagCategories: new Map() };

    if (!postIsStale(post, this.scheduler.now())) {
      return Promise.resolve(unchanged);
    }
    return this.fetchFresh(post).catch(() => unchanged);
  }

  private async fillDuration(post: Post): Promise<Post> {
    if (post.media.kind !== "video" || post.durationSeconds !== 0) {
      return post;
    }
    const durationSeconds = await this.remoteMedia.fetchDurationSeconds(post.media).catch(console.error);
    return durationSeconds === undefined ? post : { ...post, durationSeconds };
  }

  private async fetchFresh(stale: Post): Promise<CategorizedPost> {
    const { post, tagCategories } = await this.remotePosts.fetch(stale);
    return { post: { ...stale, ...post, fetchedAt: this.scheduler.now() }, tagCategories };
  }
}
