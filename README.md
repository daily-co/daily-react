# Daily React Hooks

Daily React Hooks makes it easier to integrate [@daily-co/daily-js](https://www.npmjs.com/package/@daily-co/daily-js) in React applications.

## Usage

To get started with Daily React Hooks, include [`DailyProvider`](https://docs.daily.co/reference/daily-react-hooks/daily-provider) in your app:

```jsx
import { DailyProvider } from '@daily-co/daily-react-hooks';

function App({ roomUrl }) {
  return (
    <DailyProvider url={roomUrl}>
      {/* … */}
    </DailyProvider>
  )
}
```

Then in your application you can access Daily React Hooks:

```jsx
import { useParticipant, useParticipantIds } from '@daily-co/daily-react-hooks';

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

Learn more about Daily React Hooks by reading our docs at https://docs.daily.co/reference/daily-react-hooks.

## Installation

The `daily-react-hooks` package is published to [npm](https://npmjs.com). To install the latest stable version, run one of the following commands:

```bash
npm install @daily-co/daily-react-hooks @daily-co/daily-js recoil

# or with yarn

yarn add @daily-co/daily-react-hooks @daily-co/daily-js recoil
```

Notice that `@daily-co/daily-react-hooks` requires [@daily-co/daily-js](https://www.npmjs.com/package/@daily-co/daily-js) and [recoil](https://www.npmjs.com/package/recoil) as peer dependencies.

`@daily-co/daily-react-hooks` manages its internal state using `recoil`. You can read more about `recoil` in their [Motivation](https://recoiljs.org/docs/introduction/motivation) statement.

## Tests

We've set up automatic tests using [jest](https://jestjs.io/) and [Testing Library](https://testing-library.com/). You can run the tests using the following command:

```bash
npm test

# or with yarn

yarn test
```

## Contributions

Please head over to our [contributing](./CONTRIBUTING.md) guide to learn more about how you can contribute to `daily-react-hooks`.

In case you've got general questions about Daily or need technical assistance, please reach out via [help@daily.co](mailto:help@daily.co).