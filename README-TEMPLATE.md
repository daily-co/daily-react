# Test suite name

## what do they test?

the service, api, platform... is it a smoke test?  what code does it cover?

## when do they run?

(github ci, on PR, merge, manually kicked off...)

## how to run

CLI commands (from what directory, with needed env vars / setup)
trigger in github CI with ...(PR, workflow_dispatch) - workflow yml filename

### type of test

unit or integration

### relies on daily infrastructure
[] webapp (express server)
[] database
[] sfu
[] rtmp / media server
[] cron

### how to specify what envirnment to use for each service

pass in env var, change code somehwere (may be similar to 'how to run')
can only certain services be changed (always use staging cron, etc)
is this only run against staging, etc
