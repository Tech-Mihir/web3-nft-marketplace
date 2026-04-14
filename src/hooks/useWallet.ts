import { useState, useCallback, useEffect } from 'react'
import type { StellarWallet } from '../types'

declare global {
  interface Window {
    freighter?: {
      isConnected: () => Promise<boolean>
      getPublicKey: () => Promise<string>
      signTransaction: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<string>
      getNetwork: () => Promise<string>
    }
  }
}

// Wait for Freighter to inject into the page
async function waitForFreighter(maxWait = 3000): Promise<boolean> {
  if (window.freighter) return true
  return new Promise((resolve) => {
    const start = Date.now()
    const interval = setInterval(() => {
      if (window.freighter) {
        clearInterval(interval)
        resolve(true)
      } else if (Date.now() - start > maxWait) {
        clearInterval(interval)
        resolve(false)
      }
    }, 100)
  })
}

export function useWallet(): StellarWallet {
  const [publicKey, setPublicKey] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-reconnect if already connected
  useEffect(() => {
    const tryReconnect = async () => {
      const found = await waitForFreighter()
      if (!found || !window.freighter) return
      try {
        const connected = await window.freighter.isConnected()
        if (connected) {
          const key = await window.freighter.getPublicKey()
          if (key) setPublicKey(key)
        }
      } catch { /* not connected */ }
    }
    tryReconnect()
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const found = await waitForFreighter()
      if (!found || !window.freighter) {
        setError('Freighter wallet is not installed. Please install it from freighter.app')
        return
      }
      const key = await window.freighter.getPublicKey()
      setPublicKey(key)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message ?? 'Failed to connect Freighter wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey('')
    setError(null)
  }, [])

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    const found = await waitForFreighter()
    if (!found || !window.freighter) throw new Error('Freighter not installed')
    const networkPassphrase = import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015'
    return window.freighter.signTransaction(xdr, { networkPassphrase })
  }, [])

  return {
    publicKey,
    isConnected: !!publicKey,
    isConnecting,
    error,
    connect,
    disconnect,
    signTransaction,
  }
}
