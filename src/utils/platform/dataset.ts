export function buildDataset(entries: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function setDataset(element: HTMLElement | null, name: string, value: string = ""): void {
  if (element !== null) {
    element.dataset[name] = value;
  }
}

export function removeDataset(element: HTMLElement | null, name: string): void {
  if (element !== null) {
    delete element.dataset[name];
  }
}

export function toggleDataset(element: HTMLElement | null, name: string, force?: boolean): boolean {
  if (element === null) {
    return false;
  }
  const isPresent = force ?? element.dataset[name] === undefined;

  if (isPresent) {
    element.dataset[name] = "";
  } else {
    delete element.dataset[name];
  }
  return isPresent;
}
