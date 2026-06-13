import { ConcurrencyLimiter } from "@/lib/async/concurrency_limiter";
import { RateLimiterConfig } from "@/types/async";
import { ThrottleQueue } from "@/lib/async/throttle_queue";

export class RateLimiter {
  private readonly limiter: ConcurrencyLimiter;
  private readonly throttle: ThrottleQueue;

  constructor({ concurrency, ratePerSecond }: RateLimiterConfig) {
    this.limiter = new ConcurrencyLimiter(concurrency);
    this.throttle = new ThrottleQueue(Math.round(1_000 / ratePerSecond));
  }

  public run<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiter.run(async(): Promise<T> => {
      await this.throttle.wait();
      return fn();
    });
  }
}
