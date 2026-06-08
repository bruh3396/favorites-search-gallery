export const Rule34NetworkConfig = {
  videoDurationFetchConcurrency: 3,
  videoDurationMetadataByteRanges: [500_000, 1_000_000, 2_000_000, 4_000_000],

  extensionProbeConcurrency: 3,
  extensionProbeThrottle: 20,

  generalPageRequestThrottle: 2_000,

  favoritesPageFetchDelay: 1_000,
  favoritesPageFetchRetries: 5,
  favoritesPageRetryBackoffBase: 7,
  favoritesCountFetchRetries: 5,

  favoriteRemoveRetries: 3,
  favoriteRemoveRetryDelay: 500,
  favoriteAddThrottle: 200,
  favoriteRemoveThrottle: 1_000,

  postListPrefetchLength: 3,
  postListFetchRetries: 4,
  postListFetchRetryDelay: 500
};
