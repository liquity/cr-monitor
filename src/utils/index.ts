import { UserTroveStatus } from "@liquity/lib-base";

export const isObj = (o: unknown): o is object => typeof o === "object" && o !== null;
export const hasKey = <K extends PropertyKey>(o: object, k: K): o is { [P in K]: unknown } => k in o;

const closedStatuses = new Set([
  "closedByOwner",
  "closedByLiquidation",
  "closedByRedemption"
] as const);

export type ClosedStatus = typeof closedStatuses extends Set<infer T> ? T : never;

export const isClosedStatus = (status: UserTroveStatus): status is ClosedStatus =>
  (closedStatuses as Set<string>).has(status);
