import { computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const FavoriteHeartClass = {
  root: "fsg-FavoriteHeart"
} as const;

export interface FavoriteHeartProps {
  postId: string;
  isFavorited: (postId: string) => boolean;
  addFavorite: (postId: string) => void;
  removeFavorite: (postId: string) => void;
}

export function FavoriteHeart({ postId, isFavorited: readIsFavorited, addFavorite, removeFavorite }: FavoriteHeartProps): HTMLElement {
  const isFavorited = computed(() => readIsFavorited(postId));
  return (
    <button
      className={FavoriteHeartClass.root}
      type="button"
      aria-label="Favorite"
      aria-pressed={computed(() => String(isFavorited.value))}
      onClick={() => (isFavorited.peek() ? removeFavorite : addFavorite)(postId)}
    >
      ♥
    </button>
  );
}
