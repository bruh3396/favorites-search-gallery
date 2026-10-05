import { Milestone } from "@/core/utils/reactive/milestone";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";

export type Milestones = ReturnType<typeof createMilestones>;

export function createMilestones() {
  return {
    favorites: {
      favoritesLoaded: new Milestone(),
      localFavoritesFound: new Milestone<boolean>()
    },

    postList: {
      initialPostListCreated: new Milestone<PostList>(),
      postListInitialized: new Milestone()
    }
  };
}
