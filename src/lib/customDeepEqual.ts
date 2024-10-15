/**
 * Compares two variables for deep equality.
 * Gracefully handles equality checks on MediaStreamTracks by comparing their ids.
 */
export function customDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  // Handle arrays separately
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!customDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle specific cases like MediaStream, MediaStreamTrack, Date, etc.
  if (MediaStream) {
    if (a instanceof MediaStream && b instanceof MediaStream) {
      return (
        a.id === b.id &&
        a.active === b.active &&
        a.getTracks().length === b.getTracks().length &&
        a
          .getTracks()
          .every((track, idx) => customDeepEqual(track, b.getTracks()[idx]))
      );
    }
  }

  // Handle special case for MediaStreamTrack
  if (MediaStreamTrack) {
    if (a instanceof MediaStreamTrack && b instanceof MediaStreamTrack) {
      return (
        a.id === b.id && a.kind === b.kind && a.readyState === b.readyState
      );
    }
  }

  // Handle special case for Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle special case for RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }

  // Handle Set comparisons
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    const arrA = Array.from(a).sort();
    const arrB = Array.from(b).sort();
    return arrA.every((val, idx) => customDeepEqual(val, arrB[idx]));
  }

  // Handle Map comparisons
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a.entries()) {
      if (!b.has(key) || !customDeepEqual(value, b.get(key))) return false;
    }
    return true;
  }

  // Primitive types and null checks
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  ) {
    return false;
  }

  // Generic object handling
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !customDeepEqual(a[key], b[key])
    ) {
      return false;
    }
  }

  // All keys and values match -> the objects are deeply equal
  return true;
}

/**
 * Comparison function optimized for comparing arrays.
 */
export function arraysDeepEqual(a: any[], b: any[]) {
  // Check for reference equality
  if (a === b) return true;

  // Check if both arrays are of the same length
  if (a.length !== b.length) return false;

  // Compare each element in the array
  for (let i = 0; i < a.length; i++) {
    const valueA = a[i];
    const valueB = b[i];

    const isComplexTypeA = valueA !== null && typeof valueA === 'object';
    const isComplexTypeB = valueB !== null && typeof valueB === 'object';

    // Use customDeepEqual only if either value is a complex type
    if (isComplexTypeA || isComplexTypeB) {
      if (!customDeepEqual(valueA, valueB)) return false;
    } else if (valueA !== valueB) {
      return false;
    }
  }

  return true;
}
