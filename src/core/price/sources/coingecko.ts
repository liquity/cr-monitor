import axios from "axios";

import { _MalformedResponseError } from "./_MalformedResponseError";
import { hasKey, isObj } from "../../utils";

const ethVsUsdUrl = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

interface CoinGeckoResponse {
  ethereum: {
    usd: number;
  };
}

const validateResponse = (data: unknown): data is CoinGeckoResponse =>
  isObj(data) &&
  hasKey(data, "ethereum") &&
  isObj(data.ethereum) &&
  hasKey(data.ethereum, "usd") &&
  typeof data.ethereum.usd === "number";

export const fetchPrice = async (timeout?: number): Promise<number | undefined> => {
  try {
    const response = await axios.get<unknown>(ethVsUsdUrl, { timeout });

    if (!validateResponse(response.data)) {
      throw new _MalformedResponseError("Malformed response from CoinGecko", response.data);
    }

    return response.data.ethereum.usd;
  } catch (error) {
    console.warn("Failed to fetch price from CoinGecko");
    console.warn(error);
    return undefined;
  }
};

export default fetchPrice;
