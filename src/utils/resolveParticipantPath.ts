import { DailyParticipant } from '@daily-co/daily-js';

import { NestedKeyOf } from '../types/util';

export const resolveParticipantPath = (
  participant: DailyParticipant,
  path: NestedKeyOf<DailyParticipant>
) => {
  // @ts-ignore
  return path.split('.').reduce((o, p) => o?.[p], participant);
};
