import { readFile, readdir, rm, stat } from "node:fs/promises";
import { Post } from "@/core/domain/post/post";
import { join } from "node:path";

const POST_FILE_EXTENSION = ".json";

export interface PostFile {
  readonly post: Post;
  readonly modifiedAt: number;
}

export class FilesystemClient {
  constructor(private readonly directory: string) { }

  public async readPostFiles(): Promise<PostFile[]> {
    const names = await this.readPostFileNames();
    return Promise.all(names.map(name => this.readPostFile(join(this.directory, name))));
  }

  public async countPostFiles(): Promise<number> {
    return (await this.readPostFileNames()).length;
  }

  public async deletePostFile(id: string): Promise<void> {
    await rm(join(this.directory, `${id}${POST_FILE_EXTENSION}`), { force: true });
  }

  private async readPostFileNames(): Promise<string[]> {
    return (await readdir(this.directory)).filter(name => name.endsWith(POST_FILE_EXTENSION));
  }

  private async readPostFile(path: string): Promise<PostFile> {
    const [text, stats] = await Promise.all([readFile(path, "utf8"), stat(path)]);
    return { post: JSON.parse(text) as Post, modifiedAt: stats.mtimeMs };
  }
}
