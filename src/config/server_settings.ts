import { FAVORITES_PER_PAGE } from "../lib/environment/constants";

export const ServerSettings = {
  apiBatchSize: FAVORITES_PER_PAGE,
  apiBatchFlushDelay: 2000,

  postFetchConcurrency: 4,
  tagFetchConcurrency: 4,
  extensionProbeConcurrency: 6,
  extensionProbeThrottle: 300,

  favoriteAddThrottle: 200,
  favoriteRemoveThrottle: 1000,
  generalPageRequestThrottle: 2000
};
