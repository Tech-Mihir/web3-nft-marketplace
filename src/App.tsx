import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useWallet } from './hooks/useWallet'
import { Navigation } from './components/Navigation/Navigation'
import { WalletButton } from './components/WalletButton/WalletButton'
import { ToastNotification } from './components/ToastNotification/ToastNotification'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { Staking } from './pages/Staking'
import { addToast as addToastUtil, removeToast } from './utils/toastQueue'
import type { Toast } from './types'

export default function App() {
  const { publicKey, isConnected, isConnecting, error: walletError, connect, disconnect, signTransaction } = useWallet()
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const t: Toast = { ...toast, id: crypto.randomUUID() }
    setToasts((prev) => addToastUtil(prev, t))
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => removeToast(prev, id))
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold text-white">
                ⭐ <span className="hidden sm:inline">Stellar NFT Market</span>
              </span>
              <Navigation />
            </div>
            <WalletButton
              publicKey={publicKey}
              isConnecting={isConnecting}
              onConnect={connect}
              onDisconnect={disconnect}
            />
          </div>
        </header>

        {/* Wallet error banner - only show explicit errors after connect attempt */}
        {walletError && publicKey === '' && walletError !== 'Freighter wallet not detected. Please install Freighter and refresh.' && (
          <div className="bg-orange-500/10 border-b border-orange-500/30 px-4 py-2 text-center">
            <p className="text-orange-400 text-sm">
              Freighter wallet not installed.{' '}
              <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-300">
                Install Freighter
              </a>
            </p>
          </div>
        )}

        <main>
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  publicKey={publicKey}
                  isConnecting={isConnecting}
                  onConnect={connect}
                  onDisconnect={disconnect}
                />
              }
            />
            <Route
              path="/dashboard"
              element={<Dashboard publicKey={publicKey} signTransaction={signTransaction} addToast={addToast} />}
            />
            <Route
              path="/staking"
              element={<Staking publicKey={publicKey} signTransaction={signTransaction} addToast={addToast} />}
            />
          </Routes>
        </main>

        <ToastNotification toasts={toasts} onDismiss={dismissToast} />
      </div>
    </BrowserRouter>
  )
}
