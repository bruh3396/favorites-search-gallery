import { NO_MEDIA, hasMedia } from "@/core/domain/media/media";
import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { CoalescingExecutor } from "@/core/utils/async/coalescing_executor";
import { Emitter } from "@/core/utils/reactive/emitter";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { Post } from "@/core/domain/post/post";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { TagCategory } from "@/core/domain/tag_category/tag_category";
import { daysToMilliseconds } from "@/core/utils/number/number_utilities";
import { partition } from "@/core/utils/collection/array_utilities";

const WRITE_COALESCING = { flushSize: 25, flushTimeout: 2_000 };
const POST_TIME_TO_LIVE_DAYS = 28;
const POST_TIME_TO_LIVE_JITTER_DAYS = 7;

function createPlaceholder(postId: string): Post {
  return { id: postId, width: 0, height: 0, score: 0, rating: "explicit", changedAt: 0, tags: "", media: NO_MEDIA, status: "active" };
}

function isPlaceholder(post: Post): boolean {
  return !hasMedia(post.media);
}

function hasDimensions(post: Post): boolean {
  return post.width > 0 && post.height > 0;
}

function isStale(post: Post, now: number): boolean {
  if (post.status === "purged") {
    return false;
  }
  return post.fetchedAt === undefined || now - post.fetchedAt > getPostTimeToLive(post);
}

function getPostTimeToLive(post: Post): number {
  return daysToMilliseconds(POST_TIME_TO_LIVE_DAYS + (Number(post.id) % POST_TIME_TO_LIVE_JITTER_DAYS));
}

export interface PostLibraryDependencies {
  localPosts: LocalPosts;
  localTagCategories: Pick<LocalTagCategories, "setMany">;
  remotePosts: Pick<RemotePosts, "fetch">;
  remoteMedia: Pick<RemoteMedia, "probeDurationSeconds">;
  scheduler: Scheduler;
}

export class PostLibrary {
  private readonly dependencies: PostLibraryDependencies;
  private readonly localPostsWriter: CoalescingExecutor<Post>;
  readonly #refreshed = new Emitter<Post>();

  constructor(dependencies: PostLibraryDependencies) {
    this.dependencies = dependencies;
    this.localPostsWriter = new CoalescingExecutor(WRITE_COALESCING, {
      execute: (posts): Promise<void> => dependencies.localPosts.setMany(posts),
      scheduler: dependencies.scheduler
    });
  }

  public get refreshed(): Occurrence<Post> {
    return this.#refreshed;
  }

  public async stream(postIds: readonly string[], batchSize: number, onBatch: (posts: Post[]) => void): Promise<void> {
    for (let i = 0; i < postIds.length; i += batchSize) {
      onBatch(await this.getManyOrPlaceholders(postIds.slice(i, i + batchSize)));
    }
  }

  public async adopt(posts: readonly Readonly<Post>[]): Promise<Post[]> {
    await this.dependencies.localPosts.setManyIfAbsent(posts);
    const local = await this.getLocalPostsById(posts.map(post => post.id));
    return posts.map(post => local.get(post.id) ?? post);
  }

  public async markPurged(posts: readonly Post[]): Promise<void> {
    const purged = posts.map(post => ({ ...post, status: "purged" as const }));

    await this.dependencies.localPosts.setMany(purged);
    purged.forEach(post => this.#refreshed.emit(post));
  }

  public async refresh(posts: Post[]): Promise<void> {
    const [placeholderPosts, otherPosts] = partition(posts, isPlaceholder);

    await Promise.all([...placeholderPosts, ...otherPosts].map(post => this.refreshOne(post)));
  }

  private async getManyOrPlaceholders(postIds: readonly string[]): Promise<Post[]> {
    const local = await this.getLocalPostsById(postIds);
    return postIds.map(id => local.get(id) ?? createPlaceholder(id));
  }

  private async getLocalPostsById(postIds: readonly string[]): Promise<Map<string, Post>> {
    return new Map((await this.dependencies.localPosts.getMany(postIds)).map(post => [post.id, post]));
  }

  private async refreshOne(post: Post): Promise<void> {
    const { post: refetchedPost, tagCategories } = await this.refetchIfStale(post);
    const refreshedPost = await this.fillDuration(refetchedPost);

    this.saveTagCategories(tagCategories);

    if (refreshedPost === post) {
      return;
    }

    if (hasDimensions(refreshedPost)) {
      this.localPostsWriter.schedule(refreshedPost);
    }
    this.#refreshed.emit(refreshedPost);
  }

  private saveTagCategories(tagCategories: ReadonlyMap<string, TagCategory>): void {
    if (tagCategories.size > 0) {
      this.dependencies.localTagCategories.setMany(tagCategories).catch(console.error);
    }
  }

  private refetchIfStale(post: Post): Promise<CategorizedPost> {
    const unchanged = { post, tagCategories: new Map() };

    if (!isStale(post, this.dependencies.scheduler.now())) {
      return Promise.resolve(unchanged);
    }
    return this.fetchFresh(post).catch(() => unchanged);
  }

  private async fillDuration(post: Post): Promise<Post> {
    if (post.media.kind !== "video" || post.durationSeconds !== 0) {
      return post;
    }
    const durationSeconds = await this.dependencies.remoteMedia.probeDurationSeconds(post.media).catch(console.error);
    return durationSeconds === undefined ? post : { ...post, durationSeconds };
  }

  private async fetchFresh(stalePost: Post): Promise<CategorizedPost> {
    const { remotePosts, scheduler } = this.dependencies;
    const { post, tagCategories } = await remotePosts.fetch(stalePost);
    return { post: { ...stalePost, ...post, fetchedAt: scheduler.now() }, tagCategories };
  }
}
