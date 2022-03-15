import axios from "axios";
import type { Context } from "@tenderly/actions";

import { PriceDatum, validPriceDatum } from "../price/aggregation";
import { ClosedStatus, hasKey, isObj } from "../utils";

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

const percent = (n: number) => `${Math.round(1000 * n) / 10}%`;

const dollars = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

let webhookUrl: string | undefined;

const validCrNotification = (o: unknown): o is CrNotificationParams =>
  isObj(o) &&
  hasKey(o, "threshold") &&
  typeof o.threshold === "number" &&
  hasKey(o, "current") &&
  typeof o.current === "number" &&
  hasKey(o, "price") &&
  validPriceDatum(o.price);

const postAlert = async (context: Context, title: string, messageBody: string) => {
  webhookUrl ??= await context.secrets.get("slackWebhookUrl");

  return axios.post(webhookUrl, {
    text: `Liquity Alert: ${title}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: title
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: messageBody
        }
      }
    ]
  });
};

// E.g. after notifying of a TCR drop below 180%, we won't notify again until TCR recovers to
// 180% * (1 + hysteresis) = 189%; in other words until ETH recovers by 100% * hysteresis = 5%.
const hysteresis = 0.05;

const notifyCr = async (
  context: Context,
  storageKey: string,
  title: string,
  messageBody: string,
  params: CrNotificationParams
) => {
  const lastNotification = await context.storage.getJson(storageKey);

  if (validCrNotification(lastNotification) && lastNotification.threshold === params.threshold) {
    if (params.current > params.threshold * (1 + hysteresis)) {
      await context.storage.delete(storageKey);
    }
    return;
  }

  if (params.current > params.threshold) {
    return;
  }

  await postAlert(context, title, messageBody);
  await context.storage.putJson(storageKey, params);
};

export const notifyTcr = (context: Context, params: CrNotificationParams) =>
  notifyCr(
    context,
    "notification/tcr",
    "TCR threshold crossed",
    [
      `*Current TCR*: ${percent(params.current)}`,
      `*Threshold*: ${percent(params.threshold)}`,
      `*Current price*: ${dollars(params.price.value)} (source: ${params.price.source})`
    ].join("\n"),
    params
  );

const troveNotificationStorageKey = (address: string) =>
  `notification/trove/${address.toLowerCase()}`;

export const notifyTroveCr = async (context: Context, params: TroveCrNotificationParams) => {
  const { address, name, ...crParams } = params;
  const storageKey = troveNotificationStorageKey(address);
  const lastNotification = await context.storage.getJson(storageKey);

  if (lastNotification === "closed") {
    await context.storage.delete(storageKey);
  }

  return notifyCr(
    context,
    storageKey,
    `Trove CR threshold crossed (${name})`,
    [
      `*Name*: ${name}`,
      `*Address*: <https://etherscan.io/address/${address}|${address}>`,
      `*Current CR*: ${percent(params.current)}`,
      `*Threshold*: ${percent(params.threshold)}`,
      `*Current price*: ${dollars(params.price.value)} (source: ${params.price.source})`
    ].join("\n"),
    crParams
  );
};

const lookupClosure = (status: ClosedStatus) =>
  status === "closedByLiquidation"
    ? "liquidation"
    : status === "closedByRedemption"
    ? "redemption"
    : "owner";

export const notifyTroveClosure = async (
  context: Context,
  params: TroveClosureNotificationParams
) => {
  const storageKey = troveNotificationStorageKey(params.address);
  const lastNotification = await context.storage.getJson(storageKey);

  if (lastNotification === "closed") {
    return;
  }

  await postAlert(
    context,
    `Trove closed (${params.name})`,
    [
      `*Name*: ${params.name}`,
      `*Address*: <https://etherscan.io/address/${params.address}|${params.address}>`,
      `*Closed by*: ${lookupClosure(params.status)}`,
      `*Current price*: ${dollars(params.price.value)} (source: ${params.price.source})`
    ].join("\n")
  );

  await context.storage.putJson(storageKey, "closed");
};
