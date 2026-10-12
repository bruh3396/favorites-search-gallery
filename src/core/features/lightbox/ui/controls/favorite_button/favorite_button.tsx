import { Readable, computed } from "@/core/utils/reactive/signal";
import { LightboxButton } from "@/core/features/lightbox/ui/controls/button/button";
import { h } from "@/core/ui/h/h";

export interface LightboxFavoriteButtonProps<T> {
  current: Readable<T | undefined>;
  isFavorited: (item: T) => boolean;
  addFavorite: (item: T) => void;
  removeFavorite: (item: T) => void;
}

export function LightboxFavoriteButton<T>({ current, isFavorited, addFavorite, removeFavorite }: LightboxFavoriteButtonProps<T>): HTMLElement {
  const pressed = computed(() => {
    const item = current.value;
    return item !== undefined && isFavorited(item);
  });
  const toggle = (): void => {
    const item = current.peek();

    if (item !== undefined) {
      (isFavorited(item) ? removeFavorite : addFavorite)(item);
    }
  };
  return <LightboxButton icon="heart" label="Favorite" pressed={pressed} onClick={toggle} />;
}
