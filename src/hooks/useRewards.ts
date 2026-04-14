import { useState, useEffect, useCallback } from 'react'
import { getContractConfig } from '../contracts/config'
import { readContract, buildContractCall, submitTransaction, nativeToScVal, Address } from '../contracts/stellar'
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
  publicKey: string,
  signTransaction: (xdr: string) => Promise<string>,
  addToast: (t: { type: 'pending' | 'success' | 'error'; message: string }) => void
): UseRewardsReturn {
  const [balance, setBalance] = useState('0.0000')
  const [isLoading, setIsLoading] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!publicKey) { setBalance('0.0000'); return }
    setIsLoading(true)
    setError(null)
    try {
      const config = getContractConfig()
      // Read pending rewards from staking contract (inter-contract call)
      const pending = await readContract(publicKey, config.stakingContractId, 'pending_rewards', [
        new Address(publicKey).toScVal(),
      ]) as bigint

      // Read token decimals
      const decimals = await readContract(publicKey, config.tokenContractId, 'decimals', []) as number

      setBalance(formatBalance(pending ?? 0n, decimals ?? 7))
    } catch (err) {
      setError(parseTransactionError(err))
      setBalance('0.0000')
    } finally {
      setIsLoading(false)
    }
  }, [publicKey])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  const claim = useCallback(async () => {
    if (!publicKey) return
    setIsClaiming(true)
    setError(null)
    addToast({ type: 'pending', message: 'Claiming Stellar rewards...' })
    try {
      const config = getContractConfig()
      // Claim triggers inter-contract call: staking → token contract (mint/transfer)
      const xdrStr = await buildContractCall(publicKey, config.stakingContractId, 'claim_rewards', [
        new Address(publicKey).toScVal(),
      ])
      const signed = await signTransaction(xdrStr)
      const hash = await submitTransaction(signed)
      addToast({ type: 'success', message: `Rewards claimed! Tx: ${hash.slice(0, 8)}...` })
      await fetchBalance()
    } catch (err) {
      const msg = parseTransactionError(err)
      setError(msg)
      addToast({ type: 'error', message: msg })
    } finally {
      setIsClaiming(false)
    }
  }, [publicKey, signTransaction, addToast, fetchBalance])

  return { balance, isLoading, isClaiming, error, claim, refresh: fetchBalance }
}
