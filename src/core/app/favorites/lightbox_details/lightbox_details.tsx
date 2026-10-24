import { Readable, computed } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/favorite";
import { h } from "@/core/ui/h/h";

export interface FavoriteLightboxDetailsProps {
  favorite: Readable<Pick<Favorite, "id"> | undefined>;
}

export function FavoriteLightboxDetails({ favorite }: FavoriteLightboxDetailsProps): HTMLElement {
  return <div>{computed(() => (favorite.value === undefined ? "" : `#${favorite.value.id}`))}</div> as HTMLElement;
}
