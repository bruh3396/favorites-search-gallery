import { HostEnvironment } from "@/core/boundary/environment/host_environment";
import { RuntimeEnvironment } from "@/core/boundary/environment/runtime_environment";

export interface Environment extends HostEnvironment, RuntimeEnvironment {
  readonly version: string;
}
