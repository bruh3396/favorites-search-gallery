const DEFAULT_BOUNDARIES = { start: 0, end: 0 };

function isNegatedLeftTagBoundary(text: string, index: number): boolean {
  return text[index] === "-" && (text[index - 1] === " " || text[index - 1] === undefined);
}

function isLeftTagBoundary(text: string, index: number): boolean {
  return index < 0 || text[index] === " " || isNegatedLeftTagBoundary(text, index);
}

function isRightTagBoundary(text: string, index: number): boolean {
  return index >= text.length || text[index] === " ";
}

function getLeftTagBoundary(selectionStart: number, text: string): number {
  let boundary = selectionStart - 1;

  while (!isLeftTagBoundary(text, boundary)) {
    boundary -= 1;
  }
  return boundary + 1;
}

function getRightTagBoundary(selectionStart: number, text: string): number {
  let boundary = selectionStart;

  while (!isRightTagBoundary(text, boundary)) {
    boundary += 1;
  }
  return boundary;
}

export function getTagBoundary(text: string, selectionStart: number): { start: number, end: number } {
  if (selectionStart < 0 || selectionStart > text.length || text.length === 0) {
    return DEFAULT_BOUNDARIES;
  }
  return {
    start: getLeftTagBoundary(selectionStart, text),
    end: getRightTagBoundary(selectionStart, text)
  };
}

export function replaceTag(text: string, selectionStart: number, replacement: string): string {
  if (selectionStart < 0 || selectionStart > text.length) {
    return text;
  }
  const { start, end } = getTagBoundary(text, selectionStart);
  const firstHalf = text.slice(0, start);
  const secondHalf = text.slice(end, text.length);
  return `${firstHalf}${replacement}${secondHalf}`;
}

export function getQueryWithTagReplaced(text: string, selectionStart: number, replacement: string): { result: string, selectionStart: number } {
  if (selectionStart < 0 || selectionStart > text.length) {
    return { result: text, selectionStart };
  }
  const { start, end } = getTagBoundary(text, selectionStart);
  const firstHalf = text.slice(0, start);
  const secondHalf = text.slice(end, text.length);
  const result = `${firstHalf}${replacement}${secondHalf}`;
  return {
    result,
    selectionStart: firstHalf.length + replacement.length
  };
}
