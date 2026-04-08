import type { ContractConfig } from '../types'

export function getContractConfig(): ContractConfig {
  const nftContractAddress = import.meta.env.VITE_NFT_CONTRACT_ADDRESS
  const rewardTokenAddress = import.meta.env.VITE_REWARD_TOKEN_ADDRESS
  const stakingContractAddress = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS
  const chainIdStr = import.meta.env.VITE_CHAIN_ID

  if (!nftContractAddress) throw new Error('Missing env var: VITE_NFT_CONTRACT_ADDRESS')
  if (!rewardTokenAddress) throw new Error('Missing env var: VITE_REWARD_TOKEN_ADDRESS')
  if (!stakingContractAddress) throw new Error('Missing env var: VITE_STAKING_CONTRACT_ADDRESS')

  return {
    nftContractAddress,
    rewardTokenAddress,
    stakingContractAddress,
    chainId: chainIdStr ? parseInt(chainIdStr, 10) : 1,
  }
}
