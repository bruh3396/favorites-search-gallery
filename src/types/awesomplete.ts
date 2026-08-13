declare module "awesomplete" {
  export type AwesompleteSuggestion = {
    label: string;
    value: string;
    type: string;
  }

  export interface AwesompleteOptions {
    minChars?: number;
    maxItems?: number;
    autoFirst?: boolean;
    sort?: false | ((left: AwesompleteSuggestion, right: AwesompleteSuggestion) => number);
    list?: AwesompleteSuggestion[];
    data?(suggestion: AwesompleteSuggestion, input: string): AwesompleteSuggestion;
    filter?(suggestion: AwesompleteSuggestion, input: string): boolean;
    item?(suggestion: AwesompleteSuggestion, input: string): HTMLElement;
    replace?(suggestion: AwesompleteSuggestion): void;
  }

  export default class Awesomplete {
    constructor(input: HTMLTextAreaElement | HTMLInputElement, options?: AwesompleteOptions);

    public static $: {
      regExpEscape(s: string): string;
      create(tag: string, attrs: Record<string, unknown>): HTMLElement;
    };
    public static FILTER_STARTSWITH: (value: string, input: string) => boolean;
    public static FILTER_CONTAINS: (value: string, input: string) => boolean;

    public input: HTMLTextAreaElement | HTMLInputElement;
    public list: AwesompleteSuggestion[];
    public suggestions: AwesompleteSuggestion[];
    public isOpened: boolean;
    public next(): void;
    public select(): void;
    public close(options?: { reason: string }): void;
  }
}
