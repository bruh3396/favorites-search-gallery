import { assertNever } from "@/core/utils/guards/guards";

export type Rule34ErrorReason =
  | "network"
  | "http"
  | "malformed";

export interface Rule34ErrorDetails {
  subject?: string;
  status?: number;
  cause?: unknown;
}

export class Rule34Error extends Error {
  public readonly subject: string | undefined;
  public readonly status: number | undefined;

  constructor(public readonly reason: Rule34ErrorReason, details: Rule34ErrorDetails = {}) {
    super(
      [reason, details.subject, details.status].filter(part => part !== undefined).join(" "),
      { cause: details.cause }
    );
    this.name = "Rule34Error";
    this.subject = details.subject;
    this.status = details.status;
  }
}

export function isTransient(error: unknown): boolean {
  if (!(error instanceof Rule34Error)) {
    return false;
  }

  switch (error.reason) {
    case "network":
      return true;
    case "http":
      return error.status === 429 || (error.status ?? 0) >= 500;
    case "malformed":
      return false;
    default:
      return assertNever(error.reason);
  }
}
