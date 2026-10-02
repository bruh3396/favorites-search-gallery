import { Milestone } from "@/core/utils/async/milestone";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";

export type Milestones = ReturnType<typeof createMilestones>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function createMilestones() {
  return {
    favorites: {
      favoritesLoaded: new Milestone(),
      storedFavoritesFound: new Milestone<boolean>()
    },

    postList: {
      initialPostListCreated: new Milestone<PostList>(),
      postListInitialized: new Milestone()
    }
  };
}
