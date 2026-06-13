export type Timeout = ReturnType<typeof setTimeout> | undefined

export type DeferredPromise<V> = {
  resolve: (value: V) => void
  reject: (reason: unknown) => void
};

export type RateLimiterConfig = {
  concurrency: number
  ratePerSecond: number
}
