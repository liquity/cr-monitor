import { UserTroveStatus } from "@liquity/lib-base";

export const isObj = (o: unknown): o is object => typeof o === "object" && o !== null;
export const hasKey = <K extends PropertyKey>(o: object, k: K): o is { [P in K]: unknown } => k in o;

export const percent = (n: number) => `${Math.round(1000 * n) / 10}%`;

export const dollars = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const closedStatuses = new Set([
  "closedByOwner",
  "closedByLiquidation",
  "closedByRedemption"
] as const);

export type ClosedStatus = typeof closedStatuses extends Set<infer T> ? T : never;

export const isClosedStatus = (status: UserTroveStatus): status is ClosedStatus =>
  (closedStatuses as Set<string>).has(status);

export const lookupClosure = (status: ClosedStatus) =>
  status === "closedByLiquidation"
    ? "liquidation"
    : status === "closedByRedemption"
    ? "redemption"
    : "owner";
