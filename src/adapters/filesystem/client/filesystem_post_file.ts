import { Post } from "@/core/domain/post/post";

export interface FilesystemPostFile {
  readonly post: Post;
  readonly modifiedAt: number;
}
