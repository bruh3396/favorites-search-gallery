import { ColorScheme, RuntimeEnvironment } from "@/core/boundary/environment";

export function readBrowserEnvironment(): RuntimeEnvironment {
  const agent = navigator.userAgent;
  return {
    device: (/iPhone|iPad|iPod|Android/i).test(agent) ? "mobile" : "desktop",
    pointer: matchMedia("(hover: hover) and (pointer: fine)").matches ? "hover" : "touch",
    canvasBudget: agent.toLowerCase().includes("firefox") ? "reduced" : "full"
  };
}

export function readPreferredColorScheme(): ColorScheme {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
