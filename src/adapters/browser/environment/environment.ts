import { Environment } from "@/core/boundary/environment";

export function readBrowserEnvironment(): Pick<Environment, "device" | "canvasBudget"> {
  const agent = navigator.userAgent;
  return {
    device: (/iPhone|iPad|iPod|Android/i).test(agent) ? "mobile" : "desktop",
    canvasBudget: agent.toLowerCase().includes("firefox") ? "reduced" : "full"
  };
}
