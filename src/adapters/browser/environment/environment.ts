import { Runtime } from "@/core/boundary/environment";

export function readBrowserEnvironment(): Runtime {
  const agent = navigator.userAgent;
  return {
    device: (/iPhone|iPad|iPod|Android/i).test(agent) ? "mobile" : "desktop",
    canvasBudget: agent.toLowerCase().includes("firefox") ? "reduced" : "full"
  };
}

export function readPrefersDarkMode(): boolean {
  return matchMedia("(prefers-color-scheme: dark)").matches;
}
