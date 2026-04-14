import { useState, useEffect, useCallback } from 'react'
import type { NFT } from '../types'
import { getContractConfig } from '../contracts/config'
import { readContract, buildContractCall, submitTransaction, nativeToScVal, Address } from '../contracts/stellar'
import { parseTransactionError } from '../utils/parseError'
import { xdr } from '@stellar/stellar-sdk'

interface UseNFTsReturn {
  nfts: NFT[]
  isLoading: boolean
  isMinting: boolean
  error: string | null
  refresh: () => Promise<void>
  mint: () => Promise<void>
}

export function useNFTs(
  publicKey: string,
  signTransaction: (xdr: string) => Promise<string>,
  addToast: (t: { type: 'pending' | 'success' | 'error'; message: string }) => void
): UseNFTsReturn {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNFTs = useCallback(async () => {
    if (!publicKey) { setNfts([]); return }
    setIsLoading(true)
    setError(null)
    try {
      const config = getContractConfig()

      // Get balance (number of NFTs owned)
      const balance = await readContract(publicKey, config.nftContractId, 'balance_of', [
        new Address(publicKey).toScVal(),
      ]) as bigint

      // Get staked token IDs
      let stakedIds: string[] = []
      try {
        const staked = await readContract(publicKey, config.stakingContractId, 'staked_tokens', [
          new Address(publicKey).toScVal(),
        ]) as bigint[]
        stakedIds = staked.map((id) => id.toString())
      } catch { /* staking contract may not have tokens */ }

      const stakedSet = new Set(stakedIds)

      // Fetch each token
      const nftList: NFT[] = []
      for (let i = 0n; i < (balance as bigint); i++) {
        try {
          const tokenId = await readContract(publicKey, config.nftContractId, 'token_of_owner_by_index', [
            new Address(publicKey).toScVal(),
            nativeToScVal(i, { type: 'u32' }),
          ]) as bigint

          const tokenIdStr = tokenId.toString()
          let imageUrl = `https://placehold.co/400x400/0f0f23/a78bfa?text=NFT+%23${tokenIdStr}`

          try {
            const uri = await readContract(publicKey, config.nftContractId, 'token_uri', [
              nativeToScVal(tokenId, { type: 'u32' }),
            ]) as string
            if (uri) {
              const url = uri.startsWith('ipfs://')
                ? uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
                : uri
              const res = await fetch(url)
              const meta = await res.json()
              if (meta.image) {
                imageUrl = meta.image.startsWith('ipfs://')
                  ? meta.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                  : meta.image
              }
            }
          } catch { /* use placeholder */ }

          nftList.push({ tokenId: tokenIdStr, imageUrl, isStaked: stakedSet.has(tokenIdStr), owner: publicKey })
        } catch { /* skip failed token */ }
      }

      // Also add staked NFTs
      for (const id of stakedIds) {
        if (!nftList.find((n) => n.tokenId === id)) {
          nftList.push({
            tokenId: id,
            imageUrl: `https://placehold.co/400x400/0f0f23/a78bfa?text=NFT+%23${id}`,
            isStaked: true,
            owner: publicKey,
          })
        }
      }

      setNfts(nftList)
    } catch (err) {
      setError(parseTransactionError(err))
    } finally {
      setIsLoading(false)
    }
  }, [publicKey])

  useEffect(() => { fetchNFTs() }, [fetchNFTs])

  const mint = useCallback(async () => {
    if (!publicKey) return
    setIsMinting(true)
    addToast({ type: 'pending', message: 'Minting NFT on Stellar...' })
    try {
      const config = getContractConfig()
      const xdrStr = await buildContractCall(publicKey, config.nftContractId, 'mint', [
        new Address(publicKey).toScVal(),
      ])
      const signed = await signTransaction(xdrStr)
      const hash = await submitTransaction(signed)
      addToast({ type: 'success', message: `NFT minted! Tx: ${hash.slice(0, 8)}...` })
      await fetchNFTs()
    } catch (err) {
      addToast({ type: 'error', message: parseTransactionError(err) })
    } finally {
      setIsMinting(false)
    }
  }, [publicKey, signTransaction, addToast, fetchNFTs])

  return { nfts, isLoading, isMinting, error, refresh: fetchNFTs, mint }
}
