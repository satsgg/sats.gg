# SATS.GG

A Nostr client focused on live streaming.

## Features

- [NIP-28](https://github.com/nostr-protocol/nips/blob/master/28.md) Public Chat
- [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md) Lightning Zaps
- [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) Nostr Browser Extension Support
- WebLN One Tap Zaps
- Live streaming infrastructure provided

## Setup

**yarn:**

```bash
yarn
yarn dx
```

## Start Development

**yarn:**

```bash
yarn dev -H <YOUR_LOCAL_IP>
```

### Requirements

- Node >= 14
- Postgres

### e2e tests

In order to run the e2e tests the vars in `.jest/setEnvVars.js` have to be completed.

## Development

### Start project

```bash
yarn dx
```

### Commands

```bash
yarn build      # runs `prisma generate` + `prisma migrate` + `next build`
yarn db-reset   # resets local db
yarn dev        # starts next.js
yarn dx         # starts postgres db + runs migrations + seeds + starts next.js
yarn test-dev   # runs e2e tests on dev
yarn test-start # runs e2e tests on `next start` - build required before
yarn test:unit  # runs normal jest unit tests
yarn test:e2e   # runs e2e tests
```

## Credit

https://github.com/zerealschlauskwab/lnapp-starter/tree/master
`zeRealSchlausKwab@stacker.news`, [@SchlausKwab](https://twitter.com/SchlausKwab), [zeRealSchlausKwab](https://t.me/zeRealSchlausKwab)
