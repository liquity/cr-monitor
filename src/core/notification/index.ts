import type { Storage } from "../storage";
import { PriceDatum, validPriceDatum } from "../price";
import { ClosedStatus, hasKey, isObj } from "../utils";

// E.g. after notifying of a TCR drop below 180%, we won't notify again until TCR recovers to
// 180% * (1 + hysteresis) = 189%; in other words until ETH recovers by 100% * hysteresis = 5%.
const hysteresis = 0.05;

export interface CrNotificationParams {
  threshold: number;
  current: number;
  price: PriceDatum;
}

export interface TroveCrNotificationParams extends CrNotificationParams {
  address: string;
  name: string;
}

export interface TroveClosureNotificationParams {
  address: string;
  name: string;
  price: PriceDatum;
  status: ClosedStatus;
}

export interface NotificationTarget {
  notifyTcr(params: CrNotificationParams): Promise<void>;
  notifyTroveCr(params: TroveCrNotificationParams): Promise<void>;
  notifyTroveClosure(params: TroveClosureNotificationParams): Promise<void>;
}

export interface Dispatcher {
  tcrNotification(params: CrNotificationParams): Promise<void>;
  troveCrNotification(params: TroveCrNotificationParams): Promise<void>;
  troveClosureNotification(params: TroveClosureNotificationParams): Promise<void>;
}

const validCrNotification = (o: unknown): o is CrNotificationParams =>
  isObj(o) &&
  hasKey(o, "threshold") &&
  typeof o.threshold === "number" &&
  hasKey(o, "current") &&
  typeof o.current === "number" &&
  hasKey(o, "price") &&
  validPriceDatum(o.price);

const parseJson = (value: string): unknown => (value !== "" ? JSON.parse(value) : null);
const getJson = (storage: Storage, key: string) => storage.get(key).then(parseJson);
const putJson = (storage: Storage, key: string, value: unknown) =>
  storage.put(key, JSON.stringify(value));

const shouldNotifyCr = async (
  storage: Storage,
  storageKey: string,
  params: CrNotificationParams
) => {
  const lastNotification = await getJson(storage, storageKey);

  if (validCrNotification(lastNotification) && lastNotification.threshold === params.threshold) {
    if (params.current > params.threshold * (1 + hysteresis)) {
      await storage.delete(storageKey);
    }
    return false;
  }

  if (params.current > params.threshold) {
    return false;
  }

  await putJson(storage, storageKey, params);
  return true;
};

const shouldNotifyTcr = (storage: Storage, params: CrNotificationParams) =>
  shouldNotifyCr(storage, "notification/tcr", params);

const troveNotificationStorageKey = (address: string) =>
  `notification/trove/${address.toLowerCase()}`;

const shouldNotifyTroveCr = async (storage: Storage, params: TroveCrNotificationParams) => {
  const { address, name, ...crParams } = params;
  const storageKey = troveNotificationStorageKey(address);
  const lastNotification = await getJson(storage, storageKey);

  if (lastNotification === "closed") {
    await storage.delete(storageKey);
  }

  return shouldNotifyCr(storage, storageKey, crParams);
};

const shouldNotifyTroveClosure = async (
  storage: Storage,
  params: TroveClosureNotificationParams
) => {
  const storageKey = troveNotificationStorageKey(params.address);
  const lastNotification = await getJson(storage, storageKey);

  if (lastNotification === "closed") {
    return false;
  }

  await putJson(storage, storageKey, "closed");
  return true;
};

export const dispatcher = (storage: Storage, targets: NotificationTarget[]): Dispatcher => ({
  async tcrNotification(params) {
    if (await shouldNotifyTcr(storage, params)) {
      await Promise.all(targets.map(target => target.notifyTcr(params)));
    }
  },

  async troveCrNotification(params) {
    if (await shouldNotifyTroveCr(storage, params)) {
      await Promise.all(targets.map(target => target.notifyTroveCr(params)));
    }
  },

  async troveClosureNotification(params) {
    if (await shouldNotifyTroveClosure(storage, params)) {
      await Promise.all(targets.map(target => target.notifyTroveClosure(params)));
    }
  }
});
