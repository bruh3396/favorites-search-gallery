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
  const present = force ?? element.dataset[name] === undefined;

  if (present) {
    element.dataset[name] = "";
  } else {
    delete element.dataset[name];
  }
  return present;
}
