import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { recordingInstancesState } from '../DailyRecordings';

/**
 * Returns all recording instance states.
 * Use this to render UI for multiple concurrent recordings.
 */
export const useRecordingInstances = () => {
  const instances = useAtomValue(recordingInstancesState);
  return useMemo(() => Object.values(instances), [instances]);
};
