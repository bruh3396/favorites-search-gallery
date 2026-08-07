import { RateLimiterConfig } from "@/types/async";

export const Rule34NetworkConfig = {
  videoDurationRateLimit: {concurrency: 3, ratePerSecond: 5} satisfies RateLimiterConfig,
  videoDurationMetadataByteRanges: [500_000, 1_000_000, 2_000_000, 4_000_000],

  extensionProbeRateLimit: { concurrency: 3, ratePerSecond: 50 } satisfies RateLimiterConfig,

  generalPageRequestRateLimit: { concurrency: 1, ratePerSecond: 0.25 } satisfies RateLimiterConfig,

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
