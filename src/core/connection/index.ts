import { JsonRpcProvider } from "@ethersproject/providers";
import { getNetwork } from "@ethersproject/networks";
import { EthersLiquity } from "@liquity/lib-ethers";
import { Batched } from "@liquity/providers";

const BatchedJsonRpcProvider = Batched(JsonRpcProvider);

export const connectToLiquity = (ethereumRpcUrl: string): Promise<EthersLiquity> => {
  const network = getNetwork("mainnet");

  const provider = new BatchedJsonRpcProvider(ethereumRpcUrl, network);
  provider.chainId = network.chainId;

  return EthersLiquity.connect(provider);
};
