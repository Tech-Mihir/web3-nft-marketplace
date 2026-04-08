import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { getContractConfig } from '../contracts/config'
import NFTContractABI from '../contracts/abis/NFTContract.json'
import StakingContractABI from '../contracts/abis/StakingContract.json'
import { parseTransactionError } from '../utils/parseError'

interface UseStakingReturn {
  stake: (tokenId: string) => Promise<void>
  unstake: (tokenId: string) => Promise<void>
  isStaking: Record<string, boolean>
  isUnstaking: Record<string, boolean>
  error: string | null
}

export function useStaking(
  signer: ethers.Signer | null,
  onToast: (type: 'pending' | 'success' | 'error', message: string) => void,
  onRefresh: () => Promise<void>
): UseStakingReturn {
  const [isStaking, setIsStaking] = useState<Record<string, boolean>>({})
  const [isUnstaking, setIsUnstaking] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const stake = useCallback(async (tokenId: string) => {
    if (!signer) return
    setIsStaking((prev) => ({ ...prev, [tokenId]: true }))
    setError(null)
    try {
      const config = getContractConfig()
      const nftContract = new ethers.Contract(config.nftContractAddress, NFTContractABI, signer)
      const stakingContract = new ethers.Contract(config.stakingContractAddress, StakingContractABI, signer)

      onToast('pending', `Approving NFT #${tokenId}...`)
      const approveTx = await nftContract.approve(config.stakingContractAddress, BigInt(tokenId))
      await approveTx.wait()

      onToast('pending', `Staking NFT #${tokenId}...`)
      const stakeTx = await stakingContract.stake(BigInt(tokenId))
      await stakeTx.wait()

      onToast('success', `NFT #${tokenId} staked successfully!`)
      await onRefresh()
    } catch (err) {
      const msg = parseTransactionError(err)
      setError(msg)
      onToast('error', msg)
    } finally {
      setIsStaking((prev) => ({ ...prev, [tokenId]: false }))
    }
  }, [signer, onToast, onRefresh])

  const unstake = useCallback(async (tokenId: string) => {
    if (!signer) return
    setIsUnstaking((prev) => ({ ...prev, [tokenId]: true }))
    setError(null)
    try {
      const config = getContractConfig()
      const stakingContract = new ethers.Contract(config.stakingContractAddress, StakingContractABI, signer)

      onToast('pending', `Unstaking NFT #${tokenId}...`)
      const tx = await stakingContract.unstake(BigInt(tokenId))
      await tx.wait()

      onToast('success', `NFT #${tokenId} unstaked successfully!`)
      await onRefresh()
    } catch (err) {
      const msg = parseTransactionError(err)
      setError(msg)
      onToast('error', msg)
    } finally {
      setIsUnstaking((prev) => ({ ...prev, [tokenId]: false }))
    }
  }, [signer, onToast, onRefresh])

  return { stake, unstake, isStaking, isUnstaking, error }
}
