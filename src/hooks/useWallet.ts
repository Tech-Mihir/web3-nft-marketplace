import { useState, useCallback, useEffect } from 'react'
import type { StellarWallet } from '../types'

// Freighter wallet API (injected by Freighter browser extension)
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

export function useWallet(): StellarWallet {
  const [publicKey, setPublicKey] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-reconnect if already connected
  useEffect(() => {
    const tryReconnect = async () => {
      if (!window.freighter) return
      try {
        const connected = await window.freighter.isConnected()
        if (connected) {
          const key = await window.freighter.getPublicKey()
          setPublicKey(key)
        }
      } catch {
        // not connected, ignore
      }
    }
    tryReconnect()
  }, [])

  const connect = useCallback(async () => {
    if (!window.freighter) {
      setError('Freighter wallet is not installed. Please install it from freighter.app')
      return
    }
    setIsConnecting(true)
    setError(null)
    try {
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
    if (!window.freighter) throw new Error('Freighter not installed')
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
