export interface StoryVariant {
  readonly label: string;
  render: (ownerDocument: Document, log: (message: string) => void) => HTMLElement;
}

export interface Story {
  readonly title: string;
  readonly variants: StoryVariant[];
}
