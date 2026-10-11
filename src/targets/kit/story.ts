export interface StoryVariant {
  readonly label: string;
  render: (ownerDocument: Document, log: (message: string) => void) => HTMLElement;
}

// One component shown in each state it can be in, the way a Storybook story file lists its variants.
export interface Story {
  readonly title: string;
  readonly variants: StoryVariant[];
}
