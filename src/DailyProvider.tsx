import DailyIframe, { DailyCall, DailyCallOptions } from '@daily-co/daily-js';
import React, { createContext, useEffect, useRef } from 'react';
import { RecoilRoot } from 'recoil';

type DailyProperties = Pick<
  DailyCallOptions,
  | 'audioSource'
  | 'dailyConfig'
  | 'receiveSettings'
  | 'subscribeToTracksAutomatically'
  | 'token'
  | 'url'
  | 'videoSource'
>;

type Props =
  | DailyProperties
  | {
      callObject: DailyCall;
    };

export const DailyContext = createContext<DailyCall | null>(null);

export const DailyProvider: React.FC<Props> = ({ children, ...props }) => {
  const callObject = useRef<DailyCall | null>(null);

  useEffect(() => {
    if ('callObject' in props) {
      callObject.current = props.callObject;
      return;
    }
    const co = DailyIframe.createCallObject(props);
    callObject.current = co;
  }, [props]);

  return (
    <RecoilRoot>
      <DailyContext.Provider value={callObject.current}>
        {children}
      </DailyContext.Provider>
    </RecoilRoot>
  );
};
