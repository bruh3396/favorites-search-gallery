import { RuntimeEnvironment } from "@/core/boundary/environment";

export function readBrowserEnvironment(): RuntimeEnvironment {
  const agent = navigator.userAgent;
  return {
    device: (/iPhone|iPad|iPod|Android/i).test(agent) ? "mobile" : "desktop",
    canvasBudget: agent.toLowerCase().includes("firefox") ? "reduced" : "full"
  };
}
