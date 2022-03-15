import type { ReadableLiquity } from "@liquity/lib-base";

export const fetchPrice =
  (liquity: ReadableLiquity) =>
  async (timeout?: number): Promise<number | undefined> => {
    try {
      return await Promise.race([
        liquity.getPrice().then(Number),
        ...(timeout != null
          ? [
              new Promise<number>((_, reject) =>
                setTimeout(reject, timeout, new Error(`timeout of ${timeout}ms exceeded`))
              )
            ]
          : [])
      ]);
    } catch (error) {
      console.warn("Failed to fetch price from CoinGecko");
      console.warn(error);
      return undefined;
    }
  };

export default fetchPrice;
