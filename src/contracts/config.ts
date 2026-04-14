import type { ContractConfig } from '../types'

// Stellar Testnet RPC
export const STELLAR_TESTNET_RPC = 'https://soroban-testnet.stellar.org'
export const STELLAR_TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015'
export const STELLAR_MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015'

export function getContractConfig(): ContractConfig {
  const nftContractId = import.meta.env.VITE_NFT_CONTRACT_ID
  const tokenContractId = import.meta.env.VITE_TOKEN_CONTRACT_ID
  const stakingContractId = import.meta.env.VITE_STAKING_CONTRACT_ID
  const rpcUrl = import.meta.env.VITE_SOROBAN_RPC_URL || STELLAR_TESTNET_RPC
  const networkPassphrase = import.meta.env.VITE_NETWORK_PASSPHRASE || STELLAR_TESTNET_PASSPHRASE

  if (!nftContractId) throw new Error('Missing env var: VITE_NFT_CONTRACT_ID')
  if (!tokenContractId) throw new Error('Missing env var: VITE_TOKEN_CONTRACT_ID')
  if (!stakingContractId) throw new Error('Missing env var: VITE_STAKING_CONTRACT_ID')

  return { nftContractId, tokenContractId, stakingContractId, networkPassphrase, rpcUrl }
}
