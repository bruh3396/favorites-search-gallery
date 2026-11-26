import { RequestError } from "@/core/utils/error/request_error";
import { UnreachableError } from "@/core/utils/error/unreachable_error";

export class Rule34Error extends RequestError<"network" | "http" | "malformed"> {
  public override name = "Rule34Error";
}

export function isMissingPageRule34Error(error: unknown): boolean {
  return error instanceof Rule34Error && error.reason === "http" && error.status === 404;
}

export function isRetryableRule34Error(error: unknown): boolean {
  if (!(error instanceof Rule34Error)) {
    return false;
  }

  switch (error.reason) {
    case "network":
      return true;
    case "http":
      return error.status === 403 || error.status === 429 || (error.status ?? 0) >= 500;
    case "malformed":
      return false;
    default:
      throw new UnreachableError(error.reason);
  }
}
