# Liquity CR Monitor 🚨 <!-- omit in toc -->

This project is a simple implementation of a CR ([collateral ratio](https://docs.liquity.org/faq/borrowing#what-is-the-collateral-ratio)) monitor for Liquity Protocol using the [Liquity SDK](https://docs.liquity.org/documentation/sdk).

It lets you receive push-notifications whenever the TCR (total collateral ratio) of the Liquity system, or the individual CR of any Trove in a selected list falls below a configurable threshold.

## Table of contents <!-- omit in toc -->

- [In this repo](#in-this-repo)
- [Core](#core)
  - [Example](#example)
  - [Modules](#modules)
- [Tenderly Actions example](#tenderly-actions-example)
  - [Sources](#sources)
  - [Deployment](#deployment)
    - [Setting up Tenderly CLI](#setting-up-tenderly-cli)
    - [Build & deploy action](#build--deploy-action)
    - [Setting secrects](#setting-secrects)

## In this repo

The project is made up of a dependency-minimized [core](#core), and an [example](#tenderly-actions-example) that integrates it with [Tenderly Actions](https://docs.tenderly.co/web3-actions/intro-to-web3-actions).

## Core

The minimalistic and dependency-minimized core of Liquity CR Monitor. It is designed as a one-shot task, executed by calling the function [checkPriceAndDispatchNotifications](src/core/monitoring/index.ts).

### Example

```javascript
import { connectToLiquity } from "./core/connection";
import { checkPriceAndDispatchNotifications } from "./core/monitoring";

import coingeckoPrice from "./core/price/sources/coingecko";
import liquityPrice from "./core/price/sources/liquity";
import slackNotification from "./core/notification/targets/slack";

connectToLiquity(myEthereumRpcUrl).then(liquity => {
  checkPriceAndDispatchNotifications({
    liquity,
    storage: myStorageImplementation, // Implement interface Storage from "./core/storage"

    tcrThreshold: 2.0, // 200%
    troveCrThreshold: 1.5, // 150%

    monitoredTroves: [
      { name: "Trove #1", address: "0x24fC9b59F159F6FD28F01Af892a70173A59dEd7d" },
      { name: "Trove #2", address: "0xf0439213A6236d7eDb8CBE0a036d280D058FAB6c" },
      { name: "Trove #3", address: "0xAA541196481db150cC71FaF658999831a2EABCB7" }
    ],

    priceSources: {
      CoinGecko: coingeckoPrice,
      "Liquity PriceFeed": liquityPrice(liquity)
    },

    notificationTargets: [slackNotification(mySlackWebhookUrl)]
  });
});
```

### Modules

- [core/connection](src/core/connection/index.ts): Establishing a connection with Liquity Protocol through Ethereum JSON-RPC.
- [core/monitoring](src/core/monitoring/index.ts): Querying blockchain data and calculating collateral ratios, invoking the notification dispatcher. **Contains the entry point of the monitoring core.**
- [core/notification](src/core/notification/index.ts): Dispatching notifications to targets. Uses storage to ensure notifications are only sent out once every time a threshold is crossed.
  - [core/notification/targets](src/core/notification/targets): Modules implementing various notification methods, e.g. Slack (currently the only implementation).
- [core/price](src/core/price/index.ts): Ether:USD price aggregation. Fetches Ether price (quoted in USD) from a number of sources and chooses the lowest one.
  - [core/price/sources](src/core/price/sources): Modules implementing various Ether price sources (e.g. Liquity PriceFeed contract, CoinGecko API).

## Tenderly Actions example

Example that shows how the monitoring core can be configured and integrated into Tenderly Actions.

### Sources

- [tenderly.yaml](tenderly.yaml): Tenderly Actions configuration defining a single periodic task to call the entry point of the monitor.
- [src/tenderlyFunctions.ts](src/tenderlyFunctions.ts): source file containing the entry point function referenced by `tenderly.yaml`. **Configures and invokes the monitoring core.**
- [src/tenderly](src/tenderly): Tenderly Actions-specific code for accessing secrets and persistent storage.

### Deployment

In this example, we will set up Liquity CR Monitor to send us notifications through a Slack channel and deploy it to Tenderly Actions.

We will need:

- a Tenderly [account](https://dashboard.tenderly.co/register),
- access to an Ethereum node, e.g. by creating an [Alchemy app](https://www.youtube.com/watch?v=tfggWxfG9o0),
- a [webhook](https://api.slack.com/messaging/webhooks) to our Slack channel.

#### Setting up Tenderly CLI

The first thing we need to do once we have the above prerequisites is to [install](https://github.com/Tenderly/tenderly-cli#installation) Tenderly CLI and log into our account:

```
tenderly login
```

#### Build & deploy action

After cloning this repo, we need to edit [tenderly.yaml](tenderly.yaml) and replace `liquity/cr-monitor` with our Tenderly username and project ID. We can simply use the default project that Tenderly created for us when we signed up, which is named `project`. In this case, our `tenderly.yaml` should look something like this:

```yaml
actions:
  myusername/project:
    runtime: v1
    # ... more stuff ...
```

After navigating to the directory containing `tenderly.yaml`, we should be able to build and deploy our action with:

```
tenderly actions deploy
```

Before we do this, we might want to take a look at [src/tenderlyFunctions.ts](src/tenderlyFunctions.ts) and customize our configuration, such as the list of Troves we want to monitor.

#### Setting secrects

At this stage, we should be able to navigate to the Actions page on our Tenderly dashboard and see our new action `periodicallyCheckPrice` being executed every 5 minutes. However, we'll notice that it keeps failing with `Error: SecretNotFound`.

To fix this, we need to select the Secrets tab under Actions, and add the following items:

- **Name**: `ethereumRpcUrl`, **value**: JSON-RPC URL of an Ethereum node. For example if we're using Alchemy, this will look like `"https://eth-mainnet.alchemyapi.io/v2/..."`.
- **Name**: `slackWebhookUrl`, **value**: the URL of a webhook that lets us post to our Slack channel. This should look like `"https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"`.

Once we've set these up, we should see subsequent executions of our action be successful and we should start receiving alerts in our Slack channel whenever the TCR or any of our Troves crosses its CR threshold!
