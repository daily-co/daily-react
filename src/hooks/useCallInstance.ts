import Daily, { DailyCall, DailyFactoryOptions } from '@daily-co/daily-js';
import { useEffect, useRef, useState } from 'react';

import { customDeepEqual } from '../lib/customDeepEqual';

type InstanceType = 'callFrame' | 'callObject';

const defaultShouldCreateInstance = () => true;

interface Props {
  parentEl?: HTMLElement;
  options?: DailyFactoryOptions;
  shouldCreateInstance?(): boolean;
}

const defaultProps: Props = {
  shouldCreateInstance: defaultShouldCreateInstance,
};

/**
 * Helper hook to maintain custom call instances in React codebases.
 */
export const useCallInstance = (
  type: InstanceType,
  props: Props = defaultProps
) => {
  const [callInstance, setCallInstance] = useState<DailyCall | null>(null);
  const shouldCreateInstance =
    props?.shouldCreateInstance ?? defaultShouldCreateInstance;

  /**
   * Holds last used props when callObject instance was created.
   */
  const lastUsedProps = useRef<Props>();
  useEffect(() => {
    if (!shouldCreateInstance()) {
      return;
    }

    async function destroyCallInstance(co: DailyCall) {
      await co.destroy();
    }

    /**
     * callInstance exists.
     */
    if (callInstance) {
      /**
       * Props have changed. Destroy current instance, so a new one can be created.
       */
      if (!customDeepEqual(lastUsedProps.current, props)) {
        destroyCallInstance(callInstance);
      }
      /**
       * Return early.
       */
      return;
    }

    let co = Daily.getCallInstance();
    if (!co) {
      /**
       * callInstance doesn't exist, but should be created.
       * Important to spread props, because createCallObject/createFrame alters the passed object (adds layout and dailyJsVersion).
       */
      switch (type) {
        case 'callFrame':
          co = props?.parentEl
            ? Daily.createFrame(props.parentEl, { ...props.options })
            : Daily.createFrame({ ...props.options });
          break;
        case 'callObject':
          co = Daily.createCallObject({ ...props.options });
          break;
      }
      lastUsedProps.current = props;
    }

    setCallInstance(co);

    /**
     * Once instance is destroyed, nullify callInstance, so a new one is created.
     */
    co.once('call-instance-destroyed', () => {
      setCallInstance(null);
    });

    /**
     * No cleanup phase here, because callObject.destroy() returns a Promise.
     * We can't have asynchronous cleanups in a useEffect.
     * To avoid infinite render loops we compare the props when creating call object instances.
     */
  }, [callInstance, props, shouldCreateInstance, type]);

  return callInstance;
};
