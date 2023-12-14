import { useCallInstance } from './useCallInstance';

type Props = Parameters<typeof useCallInstance>[1];

/**
 * Helper hook to maintain custom callFrame instances in React codebases.
 */
export const useCallFrame = (props: Props) =>
  useCallInstance('callFrame', props);
