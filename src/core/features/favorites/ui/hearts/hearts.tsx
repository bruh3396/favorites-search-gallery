import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export const FavoriteHeartClass = {
  root: "fsg-FavoriteHeart"
} as const;

export interface FavoriteHeartProps {
  id: string;
  favoritedById: Readable<ReadonlyMap<string, boolean>>;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
}

export function FavoriteHeart({ id, favoritedById, addFavorite, removeFavorite }: FavoriteHeartProps): HTMLElement {
  const isFavorited = computed(() => favoritedById.value.get(id) ?? true);
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
