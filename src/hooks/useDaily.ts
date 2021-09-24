import { useContext } from 'react';

import { DailyContext } from '../DailyProvider';

/**
 * Returns callObject instance passed to or created by closest <DailyProvider>.
 * @returns DailyCall | null
 */
export const useDaily = () => {
  const daily = useContext(DailyContext);
  return daily;
};
