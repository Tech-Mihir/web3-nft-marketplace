import { WalletButton } from '../components/WalletButton/WalletButton'

interface HomeProps {
  account: string | null
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}

const features = [
  { icon: '🖼️', title: 'View Your NFTs', desc: 'Browse your entire game asset collection in one place.' },
  { icon: '⚒️', title: 'Mint Game Assets', desc: 'Create new ERC-721 NFTs directly from the marketplace.' },
  { icon: '🔒', title: 'Stake to Earn', desc: 'Lock your NFTs in the staking contract to earn reward tokens.' },
  { icon: '💰', title: 'Claim Rewards', desc: 'Withdraw your earned ERC-20 reward tokens anytime.' },
]

export function Home({ account, isConnecting, onConnect, onDisconnect }: HomeProps) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/50 via-dark-900 to-dark-900 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🎮</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Web3 NFT Game<br />
            <span className="text-brand-500">Marketplace</span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Connect your MetaMask wallet to mint, view, stake, and earn rewards with your game asset NFTs.
          </p>
          <div className="flex justify-center">
            <WalletButton
              account={account}
              isConnecting={isConnecting}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />
          </div>
          {!account && (
            <p className="mt-4 text-sm text-gray-500">Connect your wallet to get started</p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Everything you need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-brand-500/40 transition-colors">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
