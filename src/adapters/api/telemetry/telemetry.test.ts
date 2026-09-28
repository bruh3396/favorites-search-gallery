import { describe, expect, test, vi } from "vitest";
import { ApiTelemetry } from "@/adapters/api/telemetry/telemetry";
import { createEnvironment } from "@/testing/environment";

describe("ApiTelemetry", () => {
  test("identifies the user and pings the server", () => {
    const calls: string[] = [];
    const api = {
      identifyAs: vi.fn(() => calls.push("identifyAs")),
      ping: vi.fn(() => calls.push("ping"))
    };

    new ApiTelemetry(api, "9").announce(createEnvironment({ version: "1.0", device: "mobile" }));
    expect(api.identifyAs).toHaveBeenCalledWith({ userId: "9", version: "1.0", platform: "mobile" });
    expect(calls).toEqual(["identifyAs", "ping"]);
  });
});
