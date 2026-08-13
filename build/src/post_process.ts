export function postProcess(content: string): string {
  return content
    .replace(/^\s*\/\/\s*(?:src|ts-raw|node_modules).*\n/gm, "")
    .replace(/\r?\n/g, "\r\n");
}
