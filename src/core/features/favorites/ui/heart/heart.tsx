import { computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const FavoriteHeartClass = {
  root: "fsg-FavoriteHeart"
} as const;

export interface FavoriteHeartProps {
  readonly id: string;
  readonly isFavorited: (id: string) => boolean;
  readonly addFavorite: (id: string) => void;
  readonly removeFavorite: (id: string) => void;
}

export function FavoriteHeart({ id, isFavorited: readIsFavorited, addFavorite, removeFavorite }: FavoriteHeartProps): HTMLElement {
  const isFavorited = computed(() => readIsFavorited(id));
  return (
    <button
      className={FavoriteHeartClass.root}
      type="button"
      aria-label="Favorite"
      aria-pressed={computed(() => String(isFavorited.value))}
      onClick={() => (isFavorited.peek() ? removeFavorite : addFavorite)(id)}
    >
      ♥
    </button>
  );
}
