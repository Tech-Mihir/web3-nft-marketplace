import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { getContractConfig } from '../contracts/config'
import StakingContractABI from '../contracts/abis/StakingContract.json'
import RewardTokenABI from '../contracts/abis/RewardToken.json'
import { formatBalance } from '../utils/formatBalance'
import { parseTransactionError } from '../utils/parseError'

interface UseRewardsReturn {
  balance: string
  isLoading: boolean
  isClaiming: boolean
  error: string | null
  claim: () => Promise<void>
  refresh: () => Promise<void>
}

export function useRewards(
  account: string | null,
  signer: ethers.Signer | null,
  onToast: (type: 'pending' | 'success' | 'error', message: string) => void
): UseRewardsReturn {
  const [balance, setBalance] = useState('0.0000')
  const [isLoading, setIsLoading] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!account || !signer) return
    setIsLoading(true)
    try {
      const config = getContractConfig()
      const stakingContract = new ethers.Contract(config.stakingContractAddress, StakingContractABI, signer)
      const rewardToken = new ethers.Contract(config.rewardTokenAddress, RewardTokenABI, signer)

      const [pending, decimals]: [bigint, number] = await Promise.all([
        stakingContract.pendingRewards(account),
        rewardToken.decimals(),
      ])
      setBalance(formatBalance(pending, decimals))
    } catch (err) {
      setError(parseTransactionError(err))
    } finally {
      setIsLoading(false)
    }
  }, [account, signer])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  const claim = useCallback(async () => {
    if (!signer) return
    setIsClaiming(true)
    onToast('pending', 'Claiming rewards...')
    try {
      const config = getContractConfig()
      const stakingContract = new ethers.Contract(config.stakingContractAddress, StakingContractABI, signer)
      const tx = await stakingContract.claim()
      await tx.wait()
      onToast('success', 'Rewards claimed successfully!')
      await fetchBalance()
    } catch (err) {
      const msg = parseTransactionError(err)
      setError(msg)
      onToast('error', msg)
    } finally {
      setIsClaiming(false)
    }
  }, [signer, fetchBalance, onToast])

  return { balance, isLoading, isClaiming, error, claim, refresh: fetchBalance }
}
