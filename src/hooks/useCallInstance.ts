import Daily, { DailyCall, DailyFactoryOptions } from '@daily-co/daily-js';
import { useEffect, useRef, useState } from 'react';

import { customDeepEqual } from '../lib/customDeepEqual';

type InstanceType = 'callFrame' | 'callObject';

const defaultOptions: DailyFactoryOptions = {};
const defaultShouldCreateInstance = () => true;

export interface Props {
  parentEl?: HTMLElement | null;
  options?: DailyFactoryOptions;
  shouldCreateInstance?(): boolean;
}

const defaultProps: Props = {
  options: defaultOptions,
  shouldCreateInstance: defaultShouldCreateInstance,
};

/**
 * Helper hook to maintain custom call instances in React codebases.
 */
export const useCallInstance = (
  type: InstanceType,
  {
    parentEl,
    options = defaultOptions,
    shouldCreateInstance = defaultShouldCreateInstance,
  }: Props = defaultProps
) => {
  const [callInstance, setCallInstance] = useState<DailyCall | null>(null);

  /**
   * Holds last used props when callObject instance was created.
   */
  const lastUsedOptions = useRef<DailyFactoryOptions>();
  useEffect(() => {
    if (!shouldCreateInstance()) {
      return;
    }

    async function destroyCallInstance(co: DailyCall) {
      await co.destroy();
    }

    /**
     * Once instance is destroyed, nullify callInstance, so a new one can be created.
     */
    const handleDestroyedInstance = () => {
      /**
       * Setting a timeout makes sure the destruction and creation
       * of call instances happen in separate call stacks.
       * Otherwise there's a risk for duplicate call instances.
       */
      setTimeout(() => setCallInstance(null), 0);
    };

    let co = Daily.getCallInstance();

    /**
     * In case a call instance exists outside of this hook instance's knowledge,
     * store it in state.
     */
    if (!callInstance && co && !co.isDestroyed()) {
      co.once('call-instance-destroyed', handleDestroyedInstance);
      setCallInstance(co);
      return;
    }

    /**
     * callInstance exists.
     */
    if (callInstance) {
      /**
       * Props have changed. Destroy current instance, so a new one can be created.
       */
      if (!customDeepEqual(lastUsedOptions.current, options)) {
        destroyCallInstance(callInstance);
      }
      /**
       * Return early.
       */
      return;
    }

    if (!co || co.isDestroyed()) {
      /**
       * callInstance doesn't exist or is destroyed (TODO: Check why getCallInstance() can return a destroyed instance),
       * but should be created.
       * Important to spread props, because createCallObject/createFrame alters the passed object (adds layout and dailyJsVersion).
       */
      switch (type) {
        case 'callFrame':
          co = parentEl
            ? Daily.createFrame(parentEl, { ...options })
            : Daily.createFrame({ ...options });
          break;
        case 'callObject':
          co = Daily.createCallObject({ ...options });
          break;
      }
      lastUsedOptions.current = options;
    }

    setCallInstance(co);

    co.once('call-instance-destroyed', handleDestroyedInstance);

    /**
     * No cleanup phase here, because callObject.destroy() returns a Promise.
     * We can't have asynchronous cleanups in a useEffect.
     * To avoid infinite render loops we compare the props when creating call object instances.
     */
  }, [callInstance, options, parentEl, shouldCreateInstance, type]);

  return callInstance;
};
