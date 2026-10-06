import { Readable, effect, untracked } from "@/core/utils/reactive/signal";
import { ScopeContext, Scoped, createScope } from "@/core/utils/reactive/scope";

export type Reactive<T> = T | Readable<T>;

export type Child = Node | string | Readable<string> | readonly Child[] | null | undefined | false;

type PropertyProps<E> = {
  [K in keyof E as E[K] extends string | number | boolean ? K : never]?: Reactive<E[K]>;
};

type ListenerProps<E> = {
  [K in keyof HTMLElementEventMap as `on${Capitalize<K>}`]?: (event: HTMLElementEventMap[K] & { currentTarget: E }) => void;
};

interface AttributeProps {
  [name: `aria-${string}`]: Reactive<string | null> | undefined;
  role?: Reactive<string>;
  dataset?: Readonly<Record<string, Reactive<string>>>;
}

export type Props<E> = PropertyProps<E> & ListenerProps<E> & AttributeProps;

const DocumentContext = new ScopeContext<Document>("document");

export function render<T>(ownerDocument: Document, build: () => T): Scoped<T> {
  return createScope(() => {
    DocumentContext.provide(ownerDocument);
    return build();
  });
}

export type Component<P> = (props: P) => HTMLElement;

export function h<P>(component: Component<P>, props: P): HTMLElement;
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props<HTMLElementTagNameMap[K]> | null,
  ...children: Child[]
): HTMLElementTagNameMap[K];
export function h(tag: string | Component<unknown>, props: object | null, ...children: Child[]): HTMLElement {
  return typeof tag === "function" ? untracked(() => tag(props ?? {})) : createElement(tag, props, children);
}

function createElement(tag: string, props: object | null, children: readonly Child[]): HTMLElement {
  const element = DocumentContext.read().createElement(tag);

  for (const [name, value] of Object.entries(props ?? {})) {
    applyProp(element, name, value);
  }
  appendChildren(element, children);
  return element;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace h {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type Element = HTMLElement;
    type IntrinsicElements = { [K in keyof HTMLElementTagNameMap]: Props<HTMLElementTagNameMap[K]> & { children?: Child } };
    interface ElementChildrenAttribute {
      children: unknown;
    }
  }
}

function applyProp(element: HTMLElement, name: string, value: unknown): void {
  if (value === undefined) {
    return;
  }

  if (name === "dataset") {
    applyDataset(element, value as Record<string, Reactive<string>>);
  } else if (typeof value === "function") {
    element.addEventListener(name.slice(2).toLowerCase(), value as EventListener);
  } else if (name === "role" || name.includes("-")) {
    bind(value, next => showAttribute(element, name, next));
  } else {
    bind(value, next => Reflect.set(element, name, next));
  }
}

function applyDataset(element: HTMLElement, dataset: Record<string, Reactive<string>>): void {
  for (const [key, value] of Object.entries(dataset)) {
    bind(value, next => {
      element.dataset[key] = String(next);
    });
  }
}

function showAttribute(element: HTMLElement, name: string, value: unknown): void {
  if (value === null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, String(value));
  }
}

function bind(value: unknown, show: (next: unknown) => void): void {
  if (isReadable(value)) {
    effect(() => show(value.value));
  } else {
    show(value);
  }
}

function appendChildren(parent: HTMLElement, children: readonly Child[]): void {
  for (const child of children) {
    appendChild(parent, child);
  }
}

function appendChild(parent: HTMLElement, child: Child): void {
  if (child === null || child === undefined || child === false) {
    return;
  }

  if (Array.isArray(child)) {
    appendChildren(parent, child);
  } else if (isReadable(child)) {
    parent.append(createText(parent.ownerDocument, child as Readable<string>));
  } else {
    parent.append(child as Node | string);
  }
}

function createText(ownerDocument: Document, text: Readable<string>): Text {
  const node = ownerDocument.createTextNode("");

  effect(() => {
    node.data = text.value;
  });
  return node;
}

function isReadable(value: unknown): value is Readable<unknown> {
  return typeof value === "object" && value !== null && "peek" in value;
}
