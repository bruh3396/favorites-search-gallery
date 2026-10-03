export interface StoryVariant {
  label: string;
  render: (ownerDocument: Document, log: (message: string) => void) => HTMLElement;
}

// One component shown in each state it can be in, the way a Storybook story file lists its variants.
export interface Story {
  title: string;
  variants: StoryVariant[];
}
