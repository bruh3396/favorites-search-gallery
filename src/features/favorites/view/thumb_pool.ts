import { Favorite } from "@/types/favorite";
import { ThumbOperations } from "@/features/favorites/types/types";

export class FavoritesThumbPool<Node> {
  private readonly nodes: Node[] = [];
  private readonly activeById = new Map<string, Node>();
  private readonly favoritedOverrides = new Map<string, boolean>();
  private activeCount = 0;

  constructor(private readonly operations: ThumbOperations<Node>, private readonly maxRetained: number, private readonly defaultFavorited: boolean) {}

  public resolve(favorites: Favorite[]): Node[] {
    this.activeById.clear();
    this.bindRange(0, favorites);
    this.activeCount = favorites.length;
    this.reclaimReserve();
    return this.nodes.slice(0, this.activeCount);
  }

  public resolveAppended(favorites: Favorite[]): Node[] {
    const start = this.activeCount;

    this.bindRange(start, favorites);
    this.activeCount += favorites.length;
    return this.nodes.slice(start, this.activeCount);
  }

  public setFavorited(id: string, favorited: boolean): void {
    this.favoritedOverrides.set(id, favorited);
    const node = this.activeById.get(id);

    if (node !== undefined) {
      this.operations.setAsFavorited(node, favorited);
    }
  }

  private bindRange(start: number, favorites: Favorite[]): void {
    for (let i = 0; i < favorites.length; i += 1) {
      const node = this.nodeAt(start + i);
      const favorite = favorites[i];

      this.operations.bind(node, favorite, this.favoritedOverrides.get(favorite.id) ?? this.defaultFavorited);
      this.activeById.set(favorite.id, node);
    }
  }

  private nodeAt(index: number): Node {
    while (this.nodes.length <= index) {
      this.nodes.push(this.operations.create());
    }
    return this.nodes[index];
  }

  private reclaimReserve(): void {
    const retained = Math.max(this.maxRetained, this.activeCount);

    if (this.nodes.length > retained) {
      this.nodes.length = retained;
    }

    for (let i = this.activeCount; i < this.nodes.length; i += 1) {
      this.operations.blankImage(this.nodes[i]);
    }
  }
}
