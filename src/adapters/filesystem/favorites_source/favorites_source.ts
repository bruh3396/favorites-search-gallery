import { Post } from "@/core/domain/post/post";
import { FavoritesSource } from "@/core/boundary/ports";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

interface PostFile {
  readonly post: Post;
  readonly modifiedAt: number;
}

export class FileSystemFavoritesSource implements FavoritesSource {
  constructor(private readonly directory: string) { }

  public async fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(await this.readAll());
  }

  public async count(): Promise<number | null> {
    return (await this.readPostFileNames()).length;
  }

  public async fetchNew(existingIds: Set<string>): Promise<Post[]> {
    return (await this.readAll()).filter(post => !existingIds.has(post.id));
  }

  private async readAll(): Promise<Post[]> {
    const names = await this.readPostFileNames();
    const files = await Promise.all(names.map(name => this.readPostFile(join(this.directory, name))));
    return files.sort((a, b) => b.modifiedAt - a.modifiedAt).map(file => file.post);
  }

  private async readPostFileNames(): Promise<string[]> {
    return (await readdir(this.directory)).filter(name => name.endsWith(".json"));
  }

  private async readPostFile(path: string): Promise<PostFile> {
    const [text, stats] = await Promise.all([readFile(path, "utf8"), stat(path)]);
    return { post: JSON.parse(text) as Post, modifiedAt: stats.mtimeMs };
  }
}
