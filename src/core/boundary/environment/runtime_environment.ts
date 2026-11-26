import { CanvasBudget } from "@/core/boundary/environment/canvas_budget";
import { Device } from "@/core/boundary/environment/device";
import { Pointer } from "@/core/boundary/environment/pointer";

export interface RuntimeEnvironment {
  readonly device: Device;
  readonly pointer: Pointer;
  readonly canvasBudget: CanvasBudget;
}
