import type { Context } from "@tenderly/actions";

import { connectToLiquity } from "./core/connection";
import { checkPriceAndDispatchNotifications } from "./core/monitoring";

import coingeckoPrice from "./core/price/sources/coingecko";
import liquityPrice from "./core/price/sources/liquity";
import slackNotification from "./core/notification/targets/slack";

import { getSecrets } from "./tenderly/secrets";
import { tenderlyStorage } from "./tenderly/storage";

const secretKeys = ["ethereumRpcUrl" as const, "slackWebhookUrl" as const];

export const checkPrice = async (context: Context) => {
  const secrets = await getSecrets(context.secrets, secretKeys);
  const liquity = await connectToLiquity(secrets.ethereumRpcUrl);

  await checkPriceAndDispatchNotifications({
    liquity,
    storage: tenderlyStorage(context.storage),

    tcrThreshold: 2.0, // 200%
    troveCrThreshold: 1.5, // 150%

    monitoredTroves: [
      { name: "Risky Trove #1", address: "0xe360934C02B4D0f0de602ea09a4ddE73287E603F" },
      { name: "Risky Trove #2", address: "0xb884F2Fe0d515c82D07C4E9b1E9f75064D079B2b" },
      { name: "Risky Trove #3", address: "0x5F1A4100cC68bbe706f37f39755C6e3a1CF999d6" }
    ],

    priceSources: {
      CoinGecko: coingeckoPrice,
      "Liquity PriceFeed": liquityPrice(liquity)
    },

    notificationTargets: [slackNotification(secrets.slackWebhookUrl)]
  });
};
