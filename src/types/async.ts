export type Timeout = undefined | ReturnType<typeof setTimeout>

export type DeferredPromise<V> = {
  resolve: (value: V) => void
  reject: (reason: unknown) => void
};

export type RateLimiterConfig = {
  concurrency: number
  ratePerSecond: number
}
