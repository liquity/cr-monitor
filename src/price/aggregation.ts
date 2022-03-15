import { hasKey, isObj } from "../utils";

const hasValue = <K, V>(entry: [K, V | undefined]): entry is [K, V] => entry[1] != null;
const compareValues = ([, a]: [unknown, number], [, b]: [unknown, number]) => a - b;

export type PriceSources = Record<string, (timeout?: number) => Promise<number | undefined>>;

export interface PriceDatum {
  source: string;
  value: number;
}

export const validPriceDatum = (o: unknown): o is PriceDatum =>
  isObj(o) &&
  hasKey(o, "source") &&
  typeof o.source === "string" &&
  hasKey(o, "value") &&
  typeof o.value === "number";

export const lowestPrice = async (sources: PriceSources, timeout?: number): Promise<PriceDatum> => {
  const responses = await Promise.all(
    Object.entries(sources).map(([source, fetchPrice]) =>
      fetchPrice(timeout).then<[string, number | undefined]>(value => [source, value])
    )
  );

  if (responses.length === 0) {
    throw new Error("failed to get price from any source");
  }

  const [[source, value]] = responses.filter(hasValue).sort(compareValues);

  return { source, value };
};
