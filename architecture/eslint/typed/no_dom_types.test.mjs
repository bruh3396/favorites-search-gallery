import { runTyped } from "#architecture/eslint/testing/typed_tester.mjs";

runTyped("no-dom-types", {
  valid: [
    "export const count: number = 1;",
    "type Post = { id: number }; declare const posts: Post[]; export const first = posts[0];",
    "declare const blob: Blob; export const size = blob.size;",
    "declare const response: Response; export const status = response.status;",
    "interface Node { id: number } declare const node: Node; export const id = node.id;"
  ],
  invalid: [
    ["export function read(element: HTMLElement): void {}", 2],
    ["declare const thumbs: HTMLElement[];", 2],
    ["export function onClick(event: MouseEvent): void {}", 2],
    ["declare const found: Element | null;", 2],
    ["export const body = document.body;", 3],
    ["export const target = window;", 2]
  ]
});
