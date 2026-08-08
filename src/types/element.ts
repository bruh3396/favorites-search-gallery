import { Emitter } from "@/lib/communication/emitter";
import { IconName } from "@/lib/ui/icon";

export interface ProgressBar {
  element: HTMLElement
  setLabel: (text: string) => void
  setProgress: (completed: number, total: number) => void
  setVisible: (visible: boolean) => void
}

export interface ButtonElement {
  parentId: string
  id: string
  enabled: boolean
  title: string
  position: InsertPosition
  textContent: string
  event: Emitter<MouseEvent> | null
  rightClickEnabled: boolean
  icon: IconName | null
}

export const defaultButtonElement: ButtonElement = {
  parentId: "",
  id: "",
  enabled: true,
  title: "",
  position: "afterbegin",
  textContent: "",
  event: null,
  rightClickEnabled: false,
  icon: null
};
