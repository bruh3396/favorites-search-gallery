export const Tooltip: HTMLElement = document.createElement("span");
export const TooltipContainer: HTMLElement = document.createElement("div");

Tooltip.id = "tooltip";
Tooltip.className = "light-green-gradient";
TooltipContainer.id = "tooltip-container";

function mountTooltip(): void {
  const container = document.getElementById("tooltip-container");

  if (container !== null) {
    container.appendChild(Tooltip);
  }
}
