import { Child, h } from "@/core/ui/h/h";

export const LabCardClass = {
  root: "fsg-LabCard"
} as const;

export interface LabCardProps {
  children: Child;
}

export function LabCard({ children }: LabCardProps): HTMLElement {
  return <div className={LabCardClass.root}>{children}</div>;
}
