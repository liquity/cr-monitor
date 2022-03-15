import { JsonRpcProvider } from "@ethersproject/providers";
import { getNetwork } from "@ethersproject/networks";
import { EthersLiquity } from "@liquity/lib-ethers";
import { Batched } from "@liquity/providers";
import type { Context } from "@tenderly/actions";

const BatchedJsonRpcProvider = Batched(JsonRpcProvider);

export const connectToLiquity = async (context: Context): Promise<EthersLiquity> => {
  const ethereumRpcUrl = await context.secrets.get("ethereumRpcUrl");
  const network = getNetwork("mainnet");
  const provider = new BatchedJsonRpcProvider(ethereumRpcUrl, network);
  const liquity = EthersLiquity.connect(provider);

  provider.chainId = network.chainId;

  return liquity;
};
