import type { Paths } from '../../types/paths';
import { ExtendedDailyParticipant } from '../DailyParticipants';

export const resolveParticipantPath = (
  participant: ExtendedDailyParticipant,
  path: Paths<ExtendedDailyParticipant>
) => {
  // ignoring the typescript here as the Paths of ExtendedDailyParticipant are not directly accessible
  // in the ExtendedDailyParticipant object
  // @ts-ignore
  return path.split('.').reduce((r, k) => r?.[k], participant);
};
