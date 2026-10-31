import { UnreachableError } from "@/core/utils/error/unreachable_error";

export type FrozenCobaltErrorReason =
  | "timeout"
  | "network"
  | "http"
  | "malformed"
  | "retry";

export interface FrozenCobaltErrorDetails {
  readonly subject?: string;
  readonly status?: number;
  readonly cause?: unknown;
}

export class FrozenCobaltError extends Error {
  public readonly subject: string | undefined;
  public readonly status: number | undefined;

  constructor(public readonly reason: FrozenCobaltErrorReason, details: FrozenCobaltErrorDetails = {}) {
    super(
      [reason, details.subject, details.status].filter(part => part !== undefined).join(" "),
      { cause: details.cause }
    );
    this.name = "FrozenCobaltError";
    this.subject = details.subject;
    this.status = details.status;
  }
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
