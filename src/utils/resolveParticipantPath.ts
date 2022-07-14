import type { Paths } from '../../types/paths';
import { ExtendedDailyParticipant } from '../DailyParticipants';

export const resolveParticipantPath = (
  participant: ExtendedDailyParticipant,
  path: Paths<ExtendedDailyParticipant>
) => {
  // @ts-ignore
  return path.split('.').reduce((r, k) => r?.[k], participant);
};
