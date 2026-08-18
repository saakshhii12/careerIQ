/**
 * utils/generateId.ts
 * Lightweight unique ID generator for chat messages. Avoids pulling
 * in a uuid dependency for something this small.
 */
let counter = 0;

export function generateId(prefix = "msg"): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export default generateId;
