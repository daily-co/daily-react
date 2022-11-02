import { createContext } from 'react';

interface DevicesContextValue {
  refreshDevices(): Promise<void>;
}

export const DailyDevicesContext = createContext<DevicesContextValue>({
  refreshDevices: () => Promise.resolve(),
});
