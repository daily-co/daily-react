import { ExtendedDailyParticipant } from '../DailyParticipants';
import { Paths } from '../types/paths';

/**
 * Returns all property paths for an object.
 */
const getPaths = (o: Record<any, any>, currentPath = ''): string[] => {
  if (typeof o !== 'object' || o === null) {
    return [currentPath];
  }

  const paths = [];
  for (const key in o) {
    if (Object.prototype.hasOwnProperty.call(o, key)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      paths.push(newPath, ...getPaths(o[key], newPath));
    }
  }

  return paths;
};

/**
 * Returns all property paths for a given participant object.
 */
export const getParticipantPaths = (p: ExtendedDailyParticipant) => {
  return getPaths(p) as Paths<ExtendedDailyParticipant>[];
};
