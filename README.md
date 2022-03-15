# Liquity CR Monitor 🚨

This project is a simple implementation of a CR ([collateral ratio](https://docs.liquity.org/faq/borrowing#what-is-the-collateral-ratio)) monitor for Liquity Protocol using the [Liquity SDK](https://docs.liquity.org/documentation/sdk).

It lets you receive push-notifications whenever the TCR (total collateral ratio) of the Liquity system, or the individual CR of any Trove in a selected list falls below a configurable threshold.

## Components

The project is made up of a dependency-minimized core, and an example that integrates it with [Tenderly Actions](https://docs.tenderly.co/web3-actions/intro-to-web3-actions).

### Core

The minimalistic and dependency-minimized core of Liquity CR Monitor. It is designed as a one-shot task, executed by calling the function [checkPriceAndDispatchNotifications](src/core/monitoring/index.ts).

#### Modules

- [core/connection](src/core/connection/index.ts): Establishing a connection with Liquity Protocol through Ethereum JSON-RPC.
- [core/monitoring](src/core/monitoring/index.ts): Querying blockchain data and calculating collateral ratios, invoking the notification dispatcher. **Contains the entry point of the monitoring core.**
- [core/notification](src/core/notification/index.ts): Dispatching notifications to targets. Uses storage to ensure notifications are only sent out once every time a threshold is crossed.
  - [core/notification/targets](src/core/notification/targets): Modules implementing various notification methods, e.g. Slack (currently the only implementation).
- [core/price](src/core/price/index.ts): Ether price aggregation. Fetches Ether price from a number of sources and chooses the lowest one.
  - [core/price/sources](src/core/price/sources): Modules implementing various Ether price sources (e.g. Liquity PriceFeed contract, CoinGecko API).

### Tenderly Actions example

Example that shows how the monitoring core can be configured and integrated into Tenderly Actions.

#### Sources

- [tenderly.yaml](tenderly.yaml): Tenderly Actions configuration defining a single periodic task to call the entry point of the monitor.
- [src/tenderlyFunctions.ts](src/tenderlyFunctions.ts): source file containing the entry point function referenced by `tenderly.yaml`. **Configures and invokes the monitoring core.**
- [src/tenderly](src/tenderly): Tenderly Actions-specific code for accessing secrets and persistent storage.

#### Deployment

> 🚧 **TODO**: explain step-by-step how to deploy the example (including setting up an Alchemy app and Slack webhook integration).
