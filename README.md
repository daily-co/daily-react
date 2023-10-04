# Daily React

Daily React makes it easier to integrate [@daily-co/daily-js](https://www.npmjs.com/package/@daily-co/daily-js) in React applications.

## Usage

To get started with Daily React, include [`DailyProvider`](https://docs.daily.co/reference/daily-react/daily-provider) in your app:

```jsx
import { DailyProvider } from '@daily-co/daily-react';

function App({ roomUrl }) {
  return (
    <DailyProvider url={roomUrl}>
      {/* … */}
    </DailyProvider>
  )
}
```

All of your Daily code will be wrapped in this `<DailyProvider>` component. For example, one frequently used hook in the library is `useParticipant`, useful for rendering the video of a specific participant, or to return helpful properties about the participant and their media tracks: 

```jsx
import { useParticipant } from '@daily-co/daily-react';

function ParticipantRow({ id }) {
  const participant = useParticipant(id);

  return (
    <li style={{ display: 'flex', gap: 8 }}>
      <span>{participant?.user_name ?? 'Guest'}</span>
      <span>📷{participant?.tracks?.video?.state === 'playable' ? '✅' : '❌'}</span>
      <span>🎙️{participant?.tracks?.audio?.state === 'playable' ? '✅' : '❌'}</span>
    </li>
  )
}
```

If you don't need those additional fields, you can also use the simpler `useParticipantIds` hook to render any components that require just a participant ID. The `useParticipantIds` hook is also filterable and sortable to create multiple lists of call participants as needed. For example, by default the list will contain the local user *and* remote participants, but you could instead limit the list to only remote participants:


```jsx
function Participants() {
  const participantIds = useParticipantIds({
    filter: 'remote',
    sort: 'user_name'
  });

  return (
    <ul>
      {participantIds.map((id) => <ParticipantRow key={id} id={id} />)}
    </ul>
  )
}
```

## Rendering a single participant's video
Rendering a single participant's video is very easy with the `<DailyVideo>` component, which only requires a participant ID:


```jsx
import { useParticipant } from '@daily-co/daily-react';

function VideoTile({ id }) {
  const participant = useParticipant(id);

  return (
    <DailyVideo key={id} sessionId={id} />
  )
}
```

## Rendering videos for many participants
Rendering a single video tile is fine, but in the majority of video calls, you'll want to render a video tile for *every* participant. This is accomplished by using the `useParticipantIds` hook in conjunction with the `<DailyVideo>` component like seen above.

```jsx
import { DailyVideo, useParticipant, useParticipantIds } from '@daily-co/daily-react';

function VideoGrid() {
  const participantIds = useParticipantIds();

  return (
    <ul>
      {participantIds.map((id) => 
        <DailyVideo key={id} sessionId={id} />
      )}
    </ul>
  )
}
```

## Playing call audio
Instead of managing every participant's tracks individually, `daily-react` makes it easy to get all the audio you need with just one line:

```jsx
import { DailyAudio } from '@daily-co/daily-react';

function Call() {
  return (
    <DailyAudio />
  )
}
```

## Enable screenshare, recording, and transcription
```jsx
import { useScreenShare, useRecording, useTranscription } from '@daily-co/daily-react';

function Call() {
  const share = useScreenShare();
  const recording = useRecording();
  const transcription = useTranscription();

  return (
    <button onClick={() => share.startScreenShare()}>Start screenshare</button>
    <button onClick={() => recording.startRecording()}>Start recording</button>
    <button onClick={() => transcription.startTranscription()}>Start transcription</button>
  )
}
```

Each of these features is very flexible, accepting many different configuration options. Be sure to check out the [screenshare](https://docs.daily.co/reference/daily-react/use-screen-share), [recording](https://docs.daily.co/reference/daily-react/use-recording), and [transcription](https://docs.daily.co/reference/daily-react/use-transcription) hook docs for a complete overview.

## Learn more
Check out https://docs.daily.co/reference/daily-react for the full `daily-react` documentation, or https://docs.daily.co/reference/daily-react#available-hooks for the full list of Daily hooks.

## Installation

The `daily-react` package is published to [npm](https://npmjs.com). To install the latest stable version, run one of the following commands:

```bash
npm install @daily-co/daily-react @daily-co/daily-js recoil

# or with yarn

yarn add @daily-co/daily-react @daily-co/daily-js recoil
```

Notice that `@daily-co/daily-react` requires [@daily-co/daily-js](https://www.npmjs.com/package/@daily-co/daily-js) and [recoil](https://www.npmjs.com/package/recoil) as peer dependencies.

`@daily-co/daily-react` manages its internal state using `recoil`. You can read more about `recoil` in their [Motivation](https://recoiljs.org/docs/introduction/motivation) statement.

## Tests

We've set up automatic tests using [jest](https://jestjs.io/) and [Testing Library](https://testing-library.com/). You can run the tests using the following command:

```bash
npm test

# or with yarn

yarn test
```

## Contributions

Please head over to our [contributing](./CONTRIBUTING.md) guide to learn more about how you can contribute to `daily-react`.

In case you've got general questions about Daily or need technical assistance, please reach out via [help@daily.co](mailto:help@daily.co).
