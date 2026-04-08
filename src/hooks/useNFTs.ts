import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import type { NFT } from '../types'
import { getContractConfig } from '../contracts/config'
import NFTContractABI from '../contracts/abis/NFTContract.json'
import StakingContractABI from '../contracts/abis/StakingContract.json'
import { parseTransactionError } from '../utils/parseError'

interface UseNFTsReturn {
  nfts: NFT[]
  isLoading: boolean
  isMinting: boolean
  error: string | null
  refresh: () => Promise<void>
  mint: () => Promise<void>
  addToast: (toast: { type: 'pending' | 'success' | 'error'; message: string }) => void
}

export function useNFTs(
  account: string | null,
  signer: ethers.Signer | null,
  addToast: (toast: { type: 'pending' | 'success' | 'error'; message: string }) => void
): Omit<UseNFTsReturn, 'addToast'> {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNFTs = useCallback(async () => {
    if (!account || !signer) {
      setNfts([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const config = getContractConfig()
      const nftContract = new ethers.Contract(config.nftContractAddress, NFTContractABI, signer)
      const stakingContract = new ethers.Contract(config.stakingContractAddress, StakingContractABI, signer)

      const balance: bigint = await nftContract.balanceOf(account)
      const stakedRaw: bigint[] = await stakingContract.stakedTokens(account)
      const stakedSet = new Set(stakedRaw.map((id) => id.toString()))

      const tokenIds: string[] = []
      for (let i = 0n; i < balance; i++) {
        const tokenId: bigint = await nftContract.tokenOfOwnerByIndex(account, i)
        tokenIds.push(tokenId.toString())
      }

      // Also include staked tokens (they're transferred to staking contract)
      for (const id of stakedRaw) {
        const idStr = id.toString()
        if (!tokenIds.includes(idStr)) tokenIds.push(idStr)
      }

      const nftList: NFT[] = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const uri: string = await nftContract.tokenURI(BigInt(tokenId))
            const url = uri.startsWith('ipfs://')
              ? uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
              : uri
            const res = await fetch(url)
            const metadata = await res.json()
            const imageUrl = (metadata.image as string).startsWith('ipfs://')
              ? (metadata.image as string).replace('ipfs://', 'https://ipfs.io/ipfs/')
              : (metadata.image as string)
            return { tokenId, imageUrl, isStaked: stakedSet.has(tokenId) }
          } catch {
            return {
              tokenId,
              imageUrl: `https://placehold.co/400x400/1a1a2e/ffffff?text=NFT+%23${tokenId}`,
              isStaked: stakedSet.has(tokenId),
            }
          }
        })
      )
      setNfts(nftList)
    } catch (err) {
      setError(parseTransactionError(err))
    } finally {
      setIsLoading(false)
    }
  }, [account, signer])

  useEffect(() => {
    fetchNFTs()
  }, [fetchNFTs])

  const mint = useCallback(async () => {
    if (!signer) return
    setIsMinting(true)
    const toastId = crypto.randomUUID()
    addToast({ type: 'pending', message: 'Minting NFT...' })
    try {
      const config = getContractConfig()
      const nftContract = new ethers.Contract(config.nftContractAddress, NFTContractABI, signer)
      const tx = await nftContract.mint()
      await tx.wait()
      addToast({ type: 'success', message: 'NFT minted successfully!' })
      await fetchNFTs()
    } catch (err) {
      addToast({ type: 'error', message: parseTransactionError(err) })
    } finally {
      setIsMinting(false)
      void toastId
    }
  }, [signer, addToast, fetchNFTs])

  return { nfts, isLoading, isMinting, error, refresh: fetchNFTs, mint }
}
