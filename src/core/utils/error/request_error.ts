interface RequestErrorDetails {
  readonly subject?: string;
  readonly status?: number;
  readonly cause?: unknown;
}

export class RequestError<Reason extends string> extends Error {
  public readonly subject: string | undefined;
  public readonly status: number | undefined;

  constructor(public readonly reason: Reason, details: RequestErrorDetails = {}) {
    super(
      [reason, details.subject, details.status].filter(part => part !== undefined).join(" "),
      { cause: details.cause }
    );
    this.name = "RequestError";
    this.subject = details.subject;
    this.status = details.status;
  }
}
