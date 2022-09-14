import { useCallback, useContext } from 'react';
import { useRecoilValue } from 'recoil';

import {
  cameraDevicesState,
  generalCameraState,
  generalMicrophoneState,
  microphoneDevicesState,
  speakerDevicesState,
} from '../DailyDevices';
import { DailyDevicesContext } from '../DailyDevicesContext';
import { useDaily } from './useDaily';

/**
 * This hook allows access to information about the user's devices and their state.
 */
export const useDevices = () => {
  const daily = useDaily();

  const camState = useRecoilValue(generalCameraState);
  const micState = useRecoilValue(generalMicrophoneState);
  const camDevices = useRecoilValue(cameraDevicesState);
  const micDevices = useRecoilValue(microphoneDevicesState);
  const speakerDevices = useRecoilValue(speakerDevicesState);

  const { refreshDevices } = useContext(DailyDevicesContext);

  /**
   * Sets video input device to given deviceId.
   */
  const setCamera = useCallback(
    async (deviceId: string) => {
      await daily?.setInputDevicesAsync({
        audioDeviceId: null,
        videoDeviceId: deviceId,
      });
    },
    [daily]
  );

  /**
   * Sets audio input device to given deviceId.
   */
  const setMicrophone = useCallback(
    async (deviceId: string) => {
      await daily?.setInputDevicesAsync({
        audioDeviceId: deviceId,
        videoDeviceId: null,
      });
    },
    [daily]
  );

  /**
   * Sets audio output device to given deviceId.
   */
  const setSpeaker = useCallback(
    async (deviceId: string) => {
      await daily?.setOutputDeviceAsync({
        outputDeviceId: deviceId,
      });
    },
    [daily]
  );

  return {
    /**
     * A list of the user's camera (videoinput) devices. See [MediaDeviceInfo](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo) for more info.
     */
    cameras: camDevices,
    /**
     * The general state for camera access.
     */
    camState,
    /**
     * Indicates that there's an issue with camera devices.
     */
    hasCamError: ['blocked', 'in-use', 'not-found'].includes(camState),
    /**
     * Indicates that there's an issue with microphone devices.
     */
    hasMicError: ['blocked', 'in-use', 'not-found'].includes(micState),
    /**
     * A list of the user's microphone (audioinput) devices. See [MediaDeviceInfo](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo) for more info.
     */
    microphones: micDevices,
    /**
     * The general state for microphone access.
     */
    micState,
    /**
     * Refreshes the list of devices using [enumerateDevices](https://docs.daily.co/reference/daily-js/instance-methods/enumerate-devices).
     */
    refreshDevices,
    /**
     * Allows to switch to the camera with the specified deviceId. Calls [setInputDevicesAsync](https://docs.daily.co/reference/daily-js/instance-methods/set-input-devices-async) internally.
     */
    setCamera,
    /**
     * Allows to switch to the microphone with the specified deviceId. Calls [setInputDevicesAsync](https://docs.daily.co/reference/daily-js/instance-methods/set-input-devices-async) internally.
     */
    setMicrophone,
    /**
     * Allows to switch to the speaker with the specified deviceId. Calls [setOutputDevice](https://docs.daily.co/reference/daily-js/instance-methods/set-output-device) internally.
     */
    setSpeaker,
    /**
     * A list of the user's speaker (audiooutput) devices. See [MediaDeviceInfo](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo) for more info.
     */
    speakers: speakerDevices,
  };
};
