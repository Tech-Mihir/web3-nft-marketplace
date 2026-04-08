import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useWallet } from './hooks/useWallet'
import { Navigation } from './components/Navigation/Navigation'
import { ToastNotification } from './components/ToastNotification/ToastNotification'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { Staking } from './pages/Staking'
import { addToast, removeToast, generateToastId } from './utils/toastQueue'
import type { Toast } from './types'

function ConfigError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-white font-bold text-lg mb-2">Configuration Error</h2>
        <p className="text-red-400 text-sm">{message}</p>
        <p className="text-gray-500 text-xs mt-4">Check your .env file and restart the dev server.</p>
      </div>
    </div>
  )
}

function AppContent() {
  const { account, signer, provider, chainId, isConnected, isConnecting, error: walletError, connect, disconnect } = useWallet()
  const [toasts, setToasts] = useState<Toast[]>([])

  // Validate contract config on startup
  let configError: string | null = null
  try {
    const nft = import.meta.env.VITE_NFT_CONTRACT_ADDRESS
    const reward = import.meta.env.VITE_REWARD_TOKEN_ADDRESS
    const staking = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS
    if (!nft) throw new Error('Missing env var: VITE_NFT_CONTRACT_ADDRESS')
    if (!reward) throw new Error('Missing env var: VITE_REWARD_TOKEN_ADDRESS')
    if (!staking) throw new Error('Missing env var: VITE_STAKING_CONTRACT_ADDRESS')
  } catch (e: unknown) {
    configError = (e as Error).message
  }

  const handleToast = useCallback((type: Toast['type'], message: string) => {
    const toast: Toast = { id: generateToastId(), type, message }
    setToasts((prev) => addToast(prev, toast))
  }, [])

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => removeToast(prev, id))
  }, [])

  // Wrong network banner
  const expectedChainId = parseInt(import.meta.env.VITE_CHAIN_ID ?? '1', 10)
  const wrongNetwork = isConnected && chainId !== null && chainId !== expectedChainId

  if (configError) return <ConfigError message={configError} />

  return (
    <>
      <Navigation />
      {wrongNetwork && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 text-center text-yellow-400 text-sm">
          Wrong network detected. Please switch to chain ID {expectedChainId} in MetaMask.
        </div>
      )}
      {walletError && !isConnected && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-center text-red-400 text-sm">
          {walletError}
          {walletError.includes('not installed') && (
            <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline ml-2">
              Install MetaMask
            </a>
          )}
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            <Home
              account={account}
              isConnecting={isConnecting}
              onConnect={connect}
              onDisconnect={disconnect}
            />
          }
        />
        <Route
          path="/dashboard"
          element={<Dashboard account={account} signer={signer} onToast={handleToast} />}
        />
        <Route
          path="/staking"
          element={<Staking account={account} signer={signer} onToast={handleToast} />}
        />
      </Routes>
      <ToastNotification toasts={toasts} onDismiss={handleDismiss} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
