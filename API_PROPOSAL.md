# daily-react API proposal

## useDaily

Core hook which initializes a callObject instance.
It is the only hook accepting configuration parameters.
Required parameters for `join` and `preAuth` are automatically assigned.

```tsx
interface UseDailyArgs {
  audioSource?: boolean | string | MediaStreamTrack;
  experimentalChromeVideoMuteLightOff?: boolean;
  receiveSettings?: object;
  subscribeToTracksAutomatically?: boolean;
  token?: string;
  url: string;
  userName?: string;
  videoSource?: boolean | string | MediaStreamTrack;
}
useDaily(args: UseDailyArgs): DailyCall;
```

## useParticipant

Returns a `DailyParticipant` object based on a given `session_id`.

```tsx
useParticipant(session_id: string): DailyParticipant;
```

## useParticipants

Returns an array of all `DailyParticipant`s.

```tsx
interface UseParticipantsArgs {
  onParticipantJoined?(ev: DailyEventObjectParticipant): void;
  onParticipantUpdated?(ev: DailyEventObjectParticipant): void;
  onParticipantLeft?(ev: DailyEventObjectParticipant): void;
}
useParticipants(args: UseParticipantsArgs): DailyParticipant[];
```

## useWaitingParticipants

Returns an array of all `DailyWaitingParticipant`s.

```tsx
interface UseWaitingParticipantsArgs {
  onWaitingParticipantAdded?(ev: DailyEventObjectWaitingParticipant): void;
  onWaitingParticipantUpdated?(ev: DailyEventObjectWaitingParticipant): void;
  onWaitingParticipantRemoved?(ev: DailyEventObjectWaitingParticipant): void;
}
useWaitingParticipants(args: UseWaitingParticipantsArgs): DailyParticipant[];
```

## useDevices

Returns lists of available media devices (cams, mics and speakers) and methods to change devices.

```tsx
interface UseDevicesArgs {
  onCameraError?(ev: DailyEventObjectCameraError): void;
}
useDevices(): {
  cams: MediaDeviceInfo[];
  cycleCamera(): void;
  disableCam(): void;
  disableMic(): void;
  enableCam(): void;
  enableMic(): void;
  mics: MediaDeviceInfo[];
  selectCam(deviceId: string): void;
  selectMic(deviceId: string): void;
  selectSpeaker(deviceId: string): void;
  speakers: MediaDeviceInfo[];
}
```

## useAppMessage

Allows to integrate app messages.

```tsx
interface UseAppMessageArgs {
  onAppMessage?(ev: DailyEventObjectAppMessage): void;
}
useAppMessage(args: UseAppMessageArgs): {
  sendAppMessage(data: any, to: string): void;
}
```

## useScreenShare

Returns a list of running screen shares and methods to start or stop screen shares.

```tsx
useScreenShare(): {
  isScreenSharing: boolean; // Wether the local user is sharing a screen
  screens: Array<{
    audio: DailyTrackState; // Track state for associated screenAudio
    session_id: string; // Session ID of user
    video: DailyTrackState; // Track state for associated screenVideo
  }>;
  startScreenShare(): void;
  stopScreenShare(): void;
}
```

## useRecording

Returns state and information of recordings.

```tsx
interface UseRecordingArgs {
  onRecordingData?(ev: DailyEvent): void;
  onRecordingError?(ev: DailyEvent): void;
  onRecordingStarted?(ev: DailyEvent): void;
  onRecordingStats?(ev: DailyEvent): void;
  onRecordingStopped?(ev: DailyEvent): void;
  onRecordingUploadCompleted?(ev: DailyEvent): void;
}
useRecording(): {
  isRecording: boolean; // Wether the call is being recorded
  startRecording(): void; // Accepts same options as daily-js equivalent
  stopRecording(); void;
}
```

## useLiveStreaming

Returns state and information of livestreams.

```tsx
interface UseLiveStreamingArgs {
  onLiveStreamingError?(ev: DailyEvent): void;
  onLiveStreamingStarted?(ev: DailyEvent): void;
  onLiveStreamingStopped?(ev: DailyEvent): void;
}
useLiveStreaming(args: UseLiveStreamingArgs): {
  isLiveStreaming: boolean;
  startLiveStreaming(): void;  // Accepts same options as daily-js equivalent
  stopLiveStreaming(): void;
  updateLiveStreaming(): void;  // Accepts same options as daily-js equivalent
}
```

## useNetwork

Returns state and information of current network quality.

```tsx
interface UseNetworkArgs {
  onNetworkQualityChange?(ev: DailyEventObjectNetworkQualityEvent): void;
  onNetworkConnection?(ev: DailyEventObjectNetworkConnectionEvent): void;
}
useNetwork(args: UseNetworkArgs): {
  stats: DailyNetworkStats; // Same as getNetworkStats(), but automatically updated
  topology: 'peer' | 'sfu';
}
```

## useDailyEvent

Allows to register Daily event listeners. Event listeners are automatically teared down when a component or hook calling `useDailyEvent` gets unmounted.

```tsx
useDailyEvent(event: DailyEvent, callback: Function): void;
```
