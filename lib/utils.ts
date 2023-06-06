export function isNumeric(s: string): boolean {
  return !isNaN(parseFloat(s));
}
