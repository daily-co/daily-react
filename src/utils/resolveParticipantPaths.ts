import { ExtendedDailyParticipant } from '../DailyParticipants';
import type { Paths } from '../types/paths';
import type { PathValue } from '../types/pathValue';

const resolvePath = <T extends ExtendedDailyParticipant, P extends Paths<T>>(
  participant: T | null,
  path: P
): PathValue<T, P> => {
  return String(path)
    .split('.')
    .filter((key) => key.length)
    .reduce((p: any, key) => p && p[key], participant);
};

type MyReturnType<T extends ExtendedDailyParticipant, P extends Paths<T>[]> = {
  [K in keyof P]-?: K extends number ? PathValue<T, P[K]> : never;
};

export const resolveParticipantPaths = <
  T extends ExtendedDailyParticipant,
  P extends Paths<T>[]
>(
  participant: T | null,
  paths: P
): MyReturnType<T, P> => {
  return paths.map((path) => resolvePath(participant, path)) as MyReturnType<
    T,
    P
  >;
};
