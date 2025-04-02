class FavoritesDownloader {
  /**
   * @param {Post[]} favorites
   */
  downloadFavorites(favorites) {
    const postCount = favorites.length;

    if (postCount === 0) {
      return;
    }
    let fetchedCount = 0;

    const onFetch = () => {
      fetchedCount += 1;
    };
    const onFetchEnd = () => {
    };
    const onZipEnd = () => {
    };

    Downloader.downloadPosts(favorites, {
      onFetch,
      onFetchEnd,
      onZipEnd
    });
  }
}
