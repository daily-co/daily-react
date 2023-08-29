/**
 * Compares two variables for deep equality.
 * Gracefully handles equality checks on MediaStreamTracks by comparing their ids.
 */
export function customDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  // Handle special case for MediaStream
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

  // Handle special case for MediaStreamTrack
  if (a instanceof MediaStreamTrack && b instanceof MediaStreamTrack) {
    return a.id === b.id && a.kind === b.kind && a.readyState === b.readyState;
  }

  // Handle special case for Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle special case for RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }

  // Handle special case for Set
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) {
      return false;
    }

    for (const value of a.values()) {
      if (!b.has(value)) {
        return false;
      }
    }

    return true;
  }

  // Handle special case for Map
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) {
      return false;
    }
    for (const [key, value] of a.entries()) {
      if (!b.has(key)) {
        return false;
      }
      if (!customDeepEqual(value, b.get(key))) {
        return false;
      }
    }

    return true;
  }

  // If a or b are not objects or null, they can't be deeply equal
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  ) {
    return false;
  }

  // Get the keys of a and b. This handles both arrays and objects, since arrays are technically objects.
  let keysA = Object.keys(a);
  let keysB = Object.keys(b);

  // If the number of keys are different, the objects are not equal
  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (
      // If key exists in a, but not in b -> not equal
      !(key in b) ||
      // Both keys exist in both object -> run nested equality check
      !customDeepEqual(a[key], b[key])
    )
      return false;
  }

  // All keys and values match -> the objects are deeply equal
  return true;
}
