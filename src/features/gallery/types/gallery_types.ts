import { GalleryMenuAction } from "../../../types/ui";

export enum GalleryState {
  Idle = 0,
  Hover = 1,
  Open = 2
}

export enum NavigationBoundary {
  None = 0,
  Left = 1,
  Right = 2
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
