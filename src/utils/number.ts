let internalSeed = 100;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomInt(maximum: number): number {
  return Math.floor(Math.random() * maximum);
}

export function randomIntInRange(min: number, max: number): number {
  return randomInt(max - min) + min;
}

export function seededRandomFloat(seed: number): number {
  const x = Math.sin(seed) * 4051.2948;
  return x - Math.floor(x);
}

export function seededRandomInt(maximum: number): number {
  internalSeed += 1;
  return Math.floor(seededRandomFloat(internalSeed) * maximum);
}

export function seededRandomIntInRange(min: number, max: number): number {
  return seededRandomInt(max - min) + min;
}

export function mapRange(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  return Math.round(toMin + (((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin)));
}

export function roundToTwoDecimalPlaces(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function millisecondsToSeconds(milliseconds: number): number {
  return roundToTwoDecimalPlaces(milliseconds / 1000);
}

export function randomBetween(min: number, max: number): number {
  return min + (Math.random() * (max - min));
}

export function numbersAroundInRange(number: number, count: number, min: number, max: number): number[] {
  if (count <= 0) {
    return [];
  }

  if (min > max) {
    return [];
  }

  const numbers = [number];
  let i = 1;

  while (numbers.length < count) {
    const left = number - i;
    const right = number + i;
    const leftInBounds = left >= min && left <= max;
    const rightInBounds = right >= min && right <= max;
    const bothOutOfBounds = !leftInBounds && !rightInBounds;

    if (bothOutOfBounds) {
      break;
    }

    if (leftInBounds) {
      numbers.push(left);
    }

    if (rightInBounds && numbers.length < count) {
      numbers.push(right);
    }
    i += 1;
  }
  return numbers.sort((a, b) => a - b);
}

export function numberRange(start: number, end: number): number[] {
  const result: number[] = [];

  for (let i = start; i <= end; i += 1) {
    result.push(i);
  }
  return result;
}
