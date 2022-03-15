import type { Context } from "@tenderly/actions";

import { connectToLiquity } from "./connection";
import { notifyTcr, notifyTroveClosure, notifyTroveCr } from "./notification";
import { defaultSources, lowestPrice } from "./price/aggregation";
import { isClosedStatus } from "./utils";

const tcrThreshold = 2.0; // 200%
const troveThreshold = 1.6; // 160%

const monitoredTroves: [name: string, address: string][] = [
  ["Risky Trove #1", "0xe360934C02B4D0f0de602ea09a4ddE73287E603F"],
  ["Risky Trove #2", "0xb884F2Fe0d515c82D07C4E9b1E9f75064D079B2b"],
  ["Risky Trove #3", "0x5F1A4100cC68bbe706f37f39755C6e3a1CF999d6"]
];

export const checkPrice = async (context: Context) => {
  const liquity = await connectToLiquity(context);
  const sources = defaultSources(liquity);

  const [price, total, totalRedistributed, ...troves] = await Promise.all([
    lowestPrice(sources, 10000),
    liquity.getTotal(),
    liquity.getTotalRedistributed(),

    ...monitoredTroves.map(([name, address]) =>
      liquity.getTroveBeforeRedistribution(address).then(trove => [name, address, trove] as const)
    )
  ]);

  await context.storage.putJson("ethPrice", price);

  await notifyTcr(context, {
    current: Number(total.collateralRatio(price.value)),
    threshold: tcrThreshold,
    price
  });

  for (const [name, address, troveBeforeRedistribution] of troves) {
    const trove = troveBeforeRedistribution.applyRedistribution(totalRedistributed);

    if (!trove.isEmpty) {
      await notifyTroveCr(context, {
        name,
        address,
        current: Number(trove.collateralRatio(price.value)),
        threshold: troveThreshold,
        price
      });
    } else {
      if (isClosedStatus(trove.status)) {
        await notifyTroveClosure(context, {
          name,
          address,
          status: trove.status,
          price
        });
      }
    }
  }
};
