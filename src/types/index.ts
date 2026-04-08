import type { ethers } from 'ethers'

export interface NFT {
  tokenId: string
  imageUrl: string
  isStaked: boolean
}

export interface Toast {
  id: string
  type: 'pending' | 'success' | 'error'
  message: string
}

export interface WalletState {
  account: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

export interface NFTState {
  nfts: NFT[]
  isLoading: boolean
  isMinting: boolean
  error: string | null
}

export interface StakingState {
  pendingTransactions: Record<string, 'staking' | 'unstaking'>
  error: string | null
}

export interface RewardsState {
  balance: string
  isLoading: boolean
  isClaiming: boolean
  error: string | null
}

export interface ToastState {
  toasts: Toast[]
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

export interface TransactionState {
  hash: string
  status: 'pending' | 'confirmed' | 'failed'
  error?: string
}

export interface ContractConfig {
  nftContractAddress: string
  rewardTokenAddress: string
  stakingContractAddress: string
  chainId: number
}

export interface UseWalletReturn {
  account: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  chainId: number | null
}
