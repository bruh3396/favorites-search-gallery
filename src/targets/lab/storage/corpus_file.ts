import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { Post } from "@/core/domain/post/post";

export interface CorpusFileConfiguration {
  readonly chunkSize: number;
}

export interface CorpusFileDependencies {
  localPosts: Pick<LocalPosts, "getMany" | "setMany">;
  corpusLocalFavorites: Pick<LocalFavorites, "getAll" | "setAll">;
  labLocalFavorites: Pick<LocalFavorites, "setAll">;
}

export class CorpusFile {
  constructor(
    private readonly configuration: CorpusFileConfiguration,
    private readonly dependencies: CorpusFileDependencies
  ) { }

  public async import(file: Blob, onProgress: (fraction: number) => void): Promise<void> {
    const { localPosts, corpusLocalFavorites, labLocalFavorites } = this.dependencies;
    const postIds: string[] = [];
    let posts: Post[] = [];

    for await (const line of readLines(file, onProgress)) {
      const post = JSON.parse(line) as Post;

      postIds.push(post.id);
      posts.push(post);

      if (posts.length === this.configuration.chunkSize) {
        await localPosts.setMany(posts);
        posts = [];
      }
    }

    if (posts.length > 0) {
      await localPosts.setMany(posts);
    }
    await corpusLocalFavorites.setAll(postIds);
    await labLocalFavorites.setAll(postIds);
  }

  public async export(writable: Pick<FileSystemWritableFileStream, "write" | "close">, onProgress: (fraction: number) => void): Promise<void> {
    const { localPosts, corpusLocalFavorites } = this.dependencies;
    const { chunkSize } = this.configuration;
    const postIds = await corpusLocalFavorites.getAll();

    for (let start = 0; start < postIds.length; start += chunkSize) {
      const posts = await localPosts.getMany(postIds.slice(start, start + chunkSize));

      await writable.write(posts.map(post => `${JSON.stringify(post)}\n`).join(""));
      onProgress(Math.min(start + chunkSize, postIds.length) / postIds.length);
    }
    await writable.close();
  }
}

async function *readLines(file: Blob, onProgress: (fraction: number) => void): AsyncIterable<string> {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let bytesRead = 0;

  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    bytesRead += chunk.value.byteLength;
    const lines = (pending + decoder.decode(chunk.value, { stream: true })).split("\n");

    pending = lines.pop() ?? "";
    yield* listFilledLines(lines);
    onProgress(bytesRead / file.size);
  }
  yield* listFilledLines([pending + decoder.decode()]);
}

function listFilledLines(lines: readonly string[]): string[] {
  return lines.map(line => line.trimEnd()).filter(line => line !== "");
}
