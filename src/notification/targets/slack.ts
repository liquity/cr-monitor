import axios from "axios";

import { dollars, lookupClosure, percent } from "../../utils";

import type {
  CrNotificationParams,
  NotificationTarget,
  TroveClosureNotificationParams,
  TroveCrNotificationParams
} from "..";

const postAlert = async (webhookUrl: string, title: string, messageBody: string) => {
  await axios.post(webhookUrl, {
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

const notifyTcr = (webhookUrl: string) => (params: CrNotificationParams) =>
  postAlert(
    webhookUrl,
    "TCR threshold crossed",
    [
      `*Current TCR*: ${percent(params.current)}`,
      `*Threshold*: ${percent(params.threshold)}`,
      `*Current price*: ${dollars(params.price.value)} (source: ${params.price.source})`
    ].join("\n")
  );

const notifyTroveCr = (webhookUrl: string) => (params: TroveCrNotificationParams) =>
  postAlert(
    webhookUrl,
    `Trove CR threshold crossed (${params.name})`,
    [
      `*Name*: ${params.name}`,
      `*Address*: <https://etherscan.io/address/${params.address}|${params.address}>`,
      `*Current CR*: ${percent(params.current)}`,
      `*Threshold*: ${percent(params.threshold)}`,
      `*Current price*: ${dollars(params.price.value)} (source: ${params.price.source})`
    ].join("\n")
  );

const notifyTroveClosure = (webhookUrl: string) => (params: TroveClosureNotificationParams) =>
  postAlert(
    webhookUrl,
    `Trove closed (${params.name})`,
    [
      `*Name*: ${params.name}`,
      `*Address*: <https://etherscan.io/address/${params.address}|${params.address}>`,
      `*Closed by*: ${lookupClosure(params.status)}`,
      `*Current price*: ${dollars(params.price.value)} (source: ${params.price.source})`
    ].join("\n")
  );

export default (webhookUrl: string): NotificationTarget => ({
  notifyTcr: notifyTcr(webhookUrl),
  notifyTroveCr: notifyTroveCr(webhookUrl),
  notifyTroveClosure: notifyTroveClosure(webhookUrl)
});
