type FindTile<T> = (post: T) => HTMLElement | undefined;

const FIND_NOTHING = (): undefined => undefined;

export class TileLocator<T> {
  private findTile: FindTile<T> = FIND_NOTHING;

  public locate(post: T): HTMLElement | undefined {
    return this.findTile(post);
  }

  public attach(findTile: FindTile<T>): () => void {
    this.findTile = findTile;
    return () => {
      if (this.findTile === findTile) {
        this.findTile = FIND_NOTHING;
      }
    };
  }
}
