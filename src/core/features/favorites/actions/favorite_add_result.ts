import { RemoteFavoriteAddResult } from "@/core/boundary/ports/remote_favorites/remote_favorite_add_result";

export type FavoriteAddResult = RemoteFavoriteAddResult | "blocked";
