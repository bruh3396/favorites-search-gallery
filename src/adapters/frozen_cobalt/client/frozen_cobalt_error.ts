import { RequestError } from "@/core/utils/error/request_error";
import { UnreachableError } from "@/core/utils/error/unreachable_error";

export class FrozenCobaltError extends RequestError<"timeout" | "network" | "http" | "malformed" | "retry"> {
  public override name = "FrozenCobaltError";
}

export function isRetryableFrozenCobaltError(error: unknown): boolean {
  if (!(error instanceof FrozenCobaltError)) {
    return false;
  }

  switch (error.reason) {
    case "timeout":
    case "network":
    case "retry":
      return true;
    case "http":
      return error.status === 429 || (error.status ?? 0) >= 500;
    case "malformed":
      return false;
    default:
      throw new UnreachableError(error.reason);
  }
}
