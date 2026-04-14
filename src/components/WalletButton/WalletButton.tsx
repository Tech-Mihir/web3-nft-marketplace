interface WalletButtonProps {
  publicKey: string
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}

function truncateKey(key: string): string {
  return `${key.slice(0, 6)}...${key.slice(-4)}`
}

export function WalletButton({ publicKey, isConnecting, onConnect, onDisconnect }: WalletButtonProps) {
  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-sm text-gray-300 bg-white/10 px-3 py-2 rounded-lg font-mono">
          {truncateKey(publicKey)}
        </span>
        <button
          onClick={onDisconnect}
          className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/30"
        >
          Disconnect
        </button>
      </div>
    )
  }

  if (isConnecting) {
    return (
      <button disabled className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium bg-purple-600/50 text-white flex items-center gap-2 cursor-not-allowed">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Connecting...
      </button>
    )
  }

  return (
    <button
      onClick={onConnect}
      className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
    >
      <img src="https://freighter.app/favicon.ico" alt="" className="w-4 h-4" onError={(e) => (e.currentTarget.style.display = 'none')} />
      Connect Freighter
    </button>
  )
}
