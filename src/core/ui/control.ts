export interface Control<T> {
  readonly element: HTMLElement;
  setValue: (value: T) => void;
  setDisabled: (disabled: boolean) => void;
}

export interface ControlOptions<T> {
  onValueChange: (next: T) => void;
}
