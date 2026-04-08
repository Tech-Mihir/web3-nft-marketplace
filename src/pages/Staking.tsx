import { ethers } from 'ethers'
import { useNFTs } from '../hooks/useNFTs'
import { useStaking } from '../hooks/useStaking'
import { useRewards } from '../hooks/useRewards'
import { NFTCard } from '../components/NFTCard/NFTCard'
import type { Toast } from '../types'

interface StakingProps {
  account: string | null
  signer: ethers.Signer | null
  onToast: (type: Toast['type'], message: string) => void
}

export function Staking({ account, signer, onToast }: StakingProps) {
  const { nfts, isLoading, refresh } = useNFTs(account, signer, onToast)
  const { stake, unstake, isStaking, isUnstaking } = useStaking(signer, onToast, refresh)
  const { balance, isClaiming, claim } = useRewards(account, signer, onToast)

  const stakedNfts = nfts.filter((n) => n.isStaked)
  const unstakedNfts = nfts.filter((n) => !n.isStaked)

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">🔌</div>
        <h2 className="text-xl font-semibold text-white mb-2">Wallet not connected</h2>
        <p className="text-gray-400">Connect your MetaMask wallet to manage staking.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Rewards Banner */}
      <div className="bg-gradient-to-r from-brand-900/60 to-brand-600/20 border border-brand-500/30 rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-gray-400 text-sm mb-1">Pending Rewards</p>
          <p className="text-3xl font-bold text-white">{balance} <span className="text-brand-400 text-lg">RWD</span></p>
          <p className="text-gray-500 text-xs mt-1">{stakedNfts.length} NFT{stakedNfts.length !== 1 ? 's' : ''} currently staked</p>
        </div>
        <button
          onClick={claim}
          disabled={isClaiming || stakedNfts.length === 0}
          className="min-h-[44px] px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors text-sm flex items-center gap-2 whitespace-nowrap"
        >
          {isClaiming ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Claiming...
            </>
          ) : '💰 Claim Rewards'}
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

      {!isLoading && (
        <>
          {/* Staked NFTs */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Staked NFTs ({stakedNfts.length})</h2>
            {stakedNfts.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <p className="text-gray-400">No staked NFTs. Stake an NFT below to start earning rewards.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stakedNfts.map((nft) => (
                  <NFTCard
                    key={nft.tokenId}
                    tokenId={nft.tokenId}
                    imageUrl={nft.imageUrl}
                    isStaked={true}
                    isPending={isUnstaking[nft.tokenId] || false}
                    onUnstake={() => unstake(nft.tokenId)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Available to Stake */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Available to Stake ({unstakedNfts.length})</h2>
            {unstakedNfts.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <p className="text-gray-400">All your NFTs are staked or you have none. Mint more from the Dashboard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {unstakedNfts.map((nft) => (
                  <NFTCard
                    key={nft.tokenId}
                    tokenId={nft.tokenId}
                    imageUrl={nft.imageUrl}
                    isStaked={false}
                    isPending={isStaking[nft.tokenId] || false}
                    onStake={() => stake(nft.tokenId)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
