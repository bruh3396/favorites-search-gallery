export type AwesompleteSuggestion = {
  label: string
  value: string
  type: string
}

export interface AwesompleteInstance {
  input: HTMLTextAreaElement | HTMLInputElement
  list: AwesompleteSuggestion[]
  isOpened: boolean
  suggestions: AwesompleteSuggestion[]
  next(): void
  select(): void
}

export interface AwesompleteConstructor {
  $: {
    regExpEscape(s: string): string
    create(tag: string, attrs: Record<string, unknown>): HTMLElement
  }
  new(input: HTMLTextAreaElement | HTMLInputElement, options: Record<string, unknown>): AwesompleteInstance
  FILTER_STARTSWITH(value: string, input: string): boolean
}
