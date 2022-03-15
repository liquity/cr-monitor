import type { ReadableLiquity } from "@liquity/lib-base";

import type { Storage } from "../storage";
import { dispatcher, NotificationTarget } from "../notification";
import { lowestPrice, PriceSources } from "../price";
import { isClosedStatus } from "../utils";

export interface MonitoredTroveParams {
  name: string;
  address: string;
}

export interface MonitoringParams {
  liquity: ReadableLiquity;
  priceSources: PriceSources;
  storage: Storage;
  notificationTargets: NotificationTarget[];

  tcrThreshold: number;
  troveCrThreshold: number;
  monitoredTroves: MonitoredTroveParams[];
}

export const checkPriceAndDispatchNotifications = async (params: MonitoringParams) => {
  const { liquity } = params;

  const [price, total, totalRedistributed, ...troves] = await Promise.all([
    lowestPrice(params.priceSources, 10000),
    liquity.getTotal(),
    liquity.getTotalRedistributed(),

    ...params.monitoredTroves.map(({ name, address }) =>
      liquity.getTroveBeforeRedistribution(address).then(trove => [name, address, trove] as const)
    )
  ]);

  const dispatch = dispatcher(params.storage, params.notificationTargets);

  await dispatch.tcrNotification({
    current: Number(total.collateralRatio(price.value)),
    threshold: params.tcrThreshold,
    price
  });

  for (const [name, address, troveBeforeRedistribution] of troves) {
    const trove = troveBeforeRedistribution.applyRedistribution(totalRedistributed);

    if (!trove.isEmpty) {
      await dispatch.troveCrNotification({
        name,
        address,
        current: Number(trove.collateralRatio(price.value)),
        threshold: params.troveCrThreshold,
        price
      });
    } else {
      if (isClosedStatus(trove.status)) {
        await dispatch.troveClosureNotification({
          name,
          address,
          status: trove.status,
          price
        });
      }
    }
  }
};
