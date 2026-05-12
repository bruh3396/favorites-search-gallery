import { GalleryMenuAction } from "../../../types/ui";

export enum GalleryState {
  Idle = 0,
  Hover = 1,
  Open = 2
}

export enum Boundary {
  None = 0,
  Start = 1,
  End = 2
}

export type VideoClip = {
  start: number
  end: number
}

export type VideoControllerCallbacks = {
  onVideoEnded: () => void;
  onVideoDoubleClicked: (event: MouseEvent) => void;
}

export type GalleryMenuButton = {
  id: string;
  icon: string;
  action: GalleryMenuAction;
  enabled: boolean;
  tooltip: string;
  color: string;
  href?: string;
};
