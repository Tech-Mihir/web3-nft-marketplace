import { ethers } from 'ethers'
import { useNFTs } from '../hooks/useNFTs'
import { useStaking } from '../hooks/useStaking'
import { NFTCard } from '../components/NFTCard/NFTCard'
import type { Toast } from '../types'

interface DashboardProps {
  account: string | null
  signer: ethers.Signer | null
  onToast: (type: Toast['type'], message: string) => void
}

export function Dashboard({ account, signer, onToast }: DashboardProps) {
  const { nfts, isLoading, isMinting, error, refresh, mint } = useNFTs(account, signer, onToast)
  const { stake, unstake, isStaking, isUnstaking } = useStaking(signer, onToast, refresh)

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">🔌</div>
        <h2 className="text-xl font-semibold text-white mb-2">Wallet not connected</h2>
        <p className="text-gray-400">Connect your MetaMask wallet to view your NFTs.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My NFTs</h1>
          <p className="text-gray-400 text-sm mt-1">{nfts.length} asset{nfts.length !== 1 ? 's' : ''} in your collection</p>
        </div>
        <button
          onClick={mint}
          disabled={isMinting}
          className="min-h-[44px] px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors text-sm flex items-center gap-2"
        >
          {isMinting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Minting...
            </>
          ) : '⚒️ Mint NFT'}
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={refresh} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && nfts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🖼️</div>
          <h3 className="text-lg font-semibold text-white mb-2">No NFTs yet</h3>
          <p className="text-gray-400 text-sm">Mint your first game asset to get started.</p>
        </div>
      )}

      {!isLoading && nfts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {nfts.map((nft) => (
            <NFTCard
              key={nft.tokenId}
              tokenId={nft.tokenId}
              imageUrl={nft.imageUrl}
              isStaked={nft.isStaked}
              isPending={isStaking[nft.tokenId] || isUnstaking[nft.tokenId] || false}
              onStake={() => stake(nft.tokenId)}
              onUnstake={() => unstake(nft.tokenId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
