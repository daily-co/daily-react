# Daily React

Daily React makes it easier to integrate [@daily-co/daily-js](https://www.npmjs.com/package/@daily-co/daily-js) in React applications.

## Usage

To get started with Daily React, include [`DailyProvider`](https://docs.daily.co/reference/daily-react/daily-provider) in your app:

```jsx
import { DailyProvider } from '@daily-co/daily-react';

function App({ roomUrl }) {
  return <DailyProvider url={roomUrl}>{/* … */}</DailyProvider>;
}
```

Then in your application you can access Daily React:

```jsx
import {
  useParticipantIds,
  useParticipantProperty,
} from '@daily-co/daily-react';

function ParticipantRow({ id }) {
  const [username, videoState, audioState] = useParticipantProperty(id, [
    'user_name',
    'tracks.video.state',
    'tracks.audio.state',
  ]);

  return (
    <li style={{ display: 'flex', gap: 8 }}>
      <span>{username ?? 'Guest'}</span>
      <span>📷{videoState === 'playable' ? '✅' : '❌'}</span>
      <span>🎙️{audioState === 'playable' ? '✅' : '❌'}</span>
    </li>
  );
}

function Participants() {
  const participantIds = useParticipantIds({
    filter: 'remote',
    sort: 'user_name',
  });

  return (
    <ul>
      {participantIds.map((id) => (
        <ParticipantRow key={id} id={id} />
      ))}
    </ul>
  );
}
```

Learn more about Daily React by reading our docs at https://docs.daily.co/reference/daily-react.

## Installation

The `daily-react` package is published to [npm](https://npmjs.com). To install the latest stable version, run one of the following commands:

```bash
npm install @daily-co/daily-react @daily-co/daily-js jotai

# or with yarn

yarn add @daily-co/daily-react @daily-co/daily-js jotai
```

Notice that `@daily-co/daily-react` requires [@daily-co/daily-js](https://www.npmjs.com/package/@daily-co/daily-js) and [jotai](https://www.npmjs.com/package/jotai) as peer dependencies.

`@daily-co/daily-react` manages its internal state using `jotai`. You can read more about `jotai` in their [Introduction](https://jotai.org).

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