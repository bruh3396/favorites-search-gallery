export const Rule34NetworkConfig = {
  videoDurationFetchConcurrency: 3,
  videoDurationMetadataByteRanges: [500_000, 1_000_000, 2_000_000, 4_000_000],

  extensionProbeConcurrency: 3,
  extensionProbeThrottle: 20,

  generalPageRequestThrottle: 2000,

  favoritesPageFetchDelay: 1000,
  favoritesPageRetryBackoffBase: 7,
  favoritesCountFetchRetries: 5,

  favoriteRemoveRetries: 3,
  favoriteRemoveRetryDelay: 250,
  favoriteAddThrottle: 200,
  favoriteRemoveThrottle: 1000,

  searchPagePrefetchLength: 2
};
