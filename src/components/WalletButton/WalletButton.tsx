interface WalletButtonProps {
  account: string | null
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletButton({ account, isConnecting, onConnect, onDisconnect }: WalletButtonProps) {
  if (account) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-sm text-gray-300 bg-white/10 px-3 py-2 rounded-lg">
          {truncateAddress(account)}
        </span>
        <button
          onClick={onDisconnect}
          className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm font-medium"
        >
          Disconnect
        </button>
      </div>
    )
  }

  if (isConnecting) {
    return (
      <button
        disabled
        className="min-h-[44px] px-6 py-2 rounded-lg bg-brand-600/50 text-white/70 flex items-center gap-2 cursor-not-allowed text-sm font-medium"
      >
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
      className="min-h-[44px] px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors text-sm"
    >
      Connect Wallet
    </button>
  )
}
