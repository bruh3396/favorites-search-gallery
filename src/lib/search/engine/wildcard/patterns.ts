const boundaryBefore = "(?<![^\\s()~])";
const boundaryAfter = "(?![^\\s()~])";
const fragmentChars = "[^\\s*()~]+";
const leadingFragment = "[^\\s*()~-][^\\s*()~]*";

export const multiStarWildcard = new RegExp(`${boundaryBefore}(-?)(\\*?)(${leadingFragment}(?:\\*${fragmentChars})+)(\\*?)${boundaryAfter}`, "g");
export const substringWildcard = new RegExp(`${boundaryBefore}(-?)\\*(${fragmentChars})\\*${boundaryAfter}`, "g");
export const suffixWildcard = new RegExp(`${boundaryBefore}(-?)\\*(${fragmentChars})${boundaryAfter}`, "g");
export const prefixWildcard = new RegExp(`${boundaryBefore}(-?)(${fragmentChars})\\*${boundaryAfter}`, "g");
