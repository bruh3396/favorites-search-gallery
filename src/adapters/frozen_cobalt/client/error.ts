import { assertNever } from "@/core/utils/guards/guards";

export type FrozenCobaltErrorReason =
  | "timeout"
  | "network"
  | "http"
  | "malformed"
  | "rate_limited"
  | "deferred"
  | "server_error"
  | "unknown_file";

export interface FrozenCobaltErrorDetails {
  subject?: string;
  status?: number;
  cause?: unknown;
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

export function isTransient(error: unknown): boolean {
  if (!(error instanceof FrozenCobaltError)) {
    return false;
  }

  switch (error.reason) {
    case "timeout":
    case "network":
    case "rate_limited":
    case "deferred":
    case "server_error":
      return true;
    case "http":
      return error.status === 429 || (error.status ?? 0) >= 500;
    case "malformed":
    case "unknown_file":
      return false;
    default:
      return assertNever(error.reason);
  }
}
