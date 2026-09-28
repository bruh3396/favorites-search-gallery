import { fetchApi, identifyAs } from "@/adapters/api/client/api";
import { Environment } from "@/core/boundary/environment";
import { Telemetry } from "@/core/boundary/ports";

export class ApiTelemetry implements Telemetry {
  constructor(private readonly userId: string) { }

  public announce({ version, device }: Environment): void {
    identifyAs({ userId: this.userId, version, platform: device });
    fetchApi("ping");
  }
}
