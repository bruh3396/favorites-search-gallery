class InfiniteScrollFeeder {
  /**
   * @param {Post[]} allFavorites
   * @returns {Post[]}
   */
  getNextBatch(allFavorites) {
    const batch = [];

    for (const favorite of allFavorites) {
      if (document.getElementById(favorite.id) === null) {
        batch.push(favorite);
      }

      if (batch.length >= 25) {
        break;
      }
    }
    return batch;
  }
}
