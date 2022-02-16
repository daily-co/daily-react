# Daily React Hooks

Daily React Hooks provide first-level support to integrate [@daily-co/daily-js](https://www.npmjs.com/package/@daily-co/daily-js) in React applications.

Find our docs at https://docs.daily.co/reference/daily-react-hooks.

## Installation

The `daily-react-hooks` package is published to [npm](https://npmjs.com). To install the latest stable version, run one of the following commands:

```bash
npm install daily-react-hooks @daily-co/daily-js recoil

# or with yarn

yarn add daily-react-hooks @daily-co/daily-js recoil
```

Notice that `daily-react-hooks` requires [@daily-co/daily-js](https://www.npmjs.com/package/@daily-co/daily-js) and [recoil](https://www.npmjs.com/package/recoil) as peer dependencies.

`daily-react-hooks` manages its internal state using `recoil`. You can read more about `recoil`'s motivation at [Recoil's Motivation](https://recoiljs.org/docs/introduction/motivation).

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