import { Props, useCallInstance } from './useCallInstance';

type CallObjectProps = Omit<Props, 'parentEl'>;

/**
 * Helper hook to maintain custom callObject instances in React codebases.
 */
export const useCallObject = (props: CallObjectProps) =>
  useCallInstance('callObject', props);
