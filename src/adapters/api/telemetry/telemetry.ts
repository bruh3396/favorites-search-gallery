import { ApiClient } from "@/adapters/api/client/client";
import { Environment } from "@/core/boundary/environment";
import { Telemetry } from "@/core/boundary/ports";

export class ApiTelemetry implements Telemetry {
  constructor(private readonly api: Pick<ApiClient, "identifyAs" | "ping">, private readonly userId: string) { }

  public announce({ version, device }: Environment): void {
    this.api.identifyAs({ userId: this.userId, version, platform: device });
    this.api.ping();
  }
}
