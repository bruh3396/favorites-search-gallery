import { Boundary } from "@/types/boundary";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";

export type PostListNavigationResult = {postList: PostList | null; boundary: Boundary};
