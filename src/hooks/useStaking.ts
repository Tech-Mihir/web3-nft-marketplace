import { useState, useCallback } from 'react'
import { getContractConfig } from '../contracts/config'
import { buildContractCall, submitTransaction, nativeToScVal, Address } from '../contracts/stellar'
import { parseTransactionError } from '../utils/parseError'

interface UseStakingReturn {
  stake: (tokenId: string) => Promise<void>
  unstake: (tokenId: string) => Promise<void>
  isStaking: Record<string, boolean>
  isUnstaking: Record<string, boolean>
  error: string | null
}

export function useStaking(
  publicKey: string,
  signTransaction: (xdr: string) => Promise<string>,
  addToast: (t: { type: 'pending' | 'success' | 'error'; message: string }) => void,
  onSuccess?: () => Promise<void>
): UseStakingReturn {
  const [isStaking, setIsStaking] = useState<Record<string, boolean>>({})
  const [isUnstaking, setIsUnstaking] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const stake = useCallback(async (tokenId: string) => {
    if (!publicKey) return
    setIsStaking((p) => ({ ...p, [tokenId]: true }))
    setError(null)
    try {
      const config = getContractConfig()

      // Step 1: Approve NFT transfer to staking contract (inter-contract call)
      addToast({ type: 'pending', message: `Approving NFT #${tokenId} for staking...` })
      const approveXdr = await buildContractCall(publicKey, config.nftContractId, 'approve', [
        new Address(publicKey).toScVal(),
        new Address(config.stakingContractId).toScVal(),
        nativeToScVal(BigInt(tokenId), { type: 'u32' }),
        nativeToScVal(true, { type: 'bool' }),
      ])
      const signedApprove = await signTransaction(approveXdr)
      await submitTransaction(signedApprove)

      // Step 2: Stake the NFT (inter-contract call from staking → NFT contract)
      addToast({ type: 'pending', message: `Staking NFT #${tokenId} on Stellar...` })
      const stakeXdr = await buildContractCall(publicKey, config.stakingContractId, 'stake', [
        new Address(publicKey).toScVal(),
        nativeToScVal(BigInt(tokenId), { type: 'u32' }),
      ])
      const signedStake = await signTransaction(stakeXdr)
      const hash = await submitTransaction(signedStake)

      addToast({ type: 'success', message: `NFT #${tokenId} staked! Tx: ${hash.slice(0, 8)}...` })
      await onSuccess?.()
    } catch (err) {
      const msg = parseTransactionError(err)
      setError(msg)
      addToast({ type: 'error', message: msg })
    } finally {
      setIsStaking((p) => ({ ...p, [tokenId]: false }))
    }
  }, [publicKey, signTransaction, addToast, onSuccess])

  const unstake = useCallback(async (tokenId: string) => {
    if (!publicKey) return
    setIsUnstaking((p) => ({ ...p, [tokenId]: true }))
    setError(null)
    try {
      const config = getContractConfig()
      addToast({ type: 'pending', message: `Unstaking NFT #${tokenId}...` })
      const xdrStr = await buildContractCall(publicKey, config.stakingContractId, 'unstake', [
        new Address(publicKey).toScVal(),
        nativeToScVal(BigInt(tokenId), { type: 'u32' }),
      ])
      const signed = await signTransaction(xdrStr)
      const hash = await submitTransaction(signed)
      addToast({ type: 'success', message: `NFT #${tokenId} unstaked! Tx: ${hash.slice(0, 8)}...` })
      await onSuccess?.()
    } catch (err) {
      const msg = parseTransactionError(err)
      setError(msg)
      addToast({ type: 'error', message: msg })
    } finally {
      setIsUnstaking((p) => ({ ...p, [tokenId]: false }))
    }
  }, [publicKey, signTransaction, addToast, onSuccess])

  return { stake, unstake, isStaking, isUnstaking, error }
}
