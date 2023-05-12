# Daily React Jest tests

## what do they test?

These tests cover the functionality of the components and hooks provided by Daily React.

## when do they run?

- Automatically on GitHub CI when working on a PR with the `daily-react` label and changes inside the `daily-react` directory
- Manually when run locally

## how to run

```bash
cd north-star
# Runs all tests
yarn workspace @daily-co/daily-react test
# Opens jest in watch mode
yarn workspace @daily-co/daily-react test --watch
```

### type of test

Component/Unit tests.

### relies on daily infrastructure

[ ] webapp (express server)
[ ] database
[ ] sfu
[ ] rtmp / media server
[ ] cron

No running infrastructure required. All tests run against a mocked version of daily-js.

### how to specify what environment to use for each service

No environment information needed for these tests.