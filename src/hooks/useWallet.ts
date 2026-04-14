import { useState, useCallback, useEffect } from 'react'
import type { StellarWallet } from '../types'

// Freighter v5+ injects window.freighterApi (not window.freighter)
declare global {
  interface Window {
    freighter?: unknown
    freighterApi?: {
      isConnected: () => Promise<{ isConnected: boolean }>
      getAddress: () => Promise<{ address: string; error?: string }>
      signTransaction: (xdr: string, opts?: object) => Promise<{ signedTxXdr: string; error?: string }>
    }
  }
}

async function getApi() {
  // Wait up to 3s for extension to inject
  for (let i = 0; i < 30; i++) {
    if (window.freighterApi) return window.freighterApi
    if (window.freighter) return window.freighter as typeof window.freighterApi
    await new Promise(r => setTimeout(r, 100))
  }
  return null
}

export function useWallet(): StellarWallet {
  const [publicKey, setPublicKey] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [freighterDetected, setFreighterDetected] = useState(false)

  useEffect(() => {
    const tryReconnect = async () => {
      const api = await getApi()
      if (api) {
        setFreighterDetected(true)
        try {
          const { isConnected } = await api.isConnected()
          if (isConnected) {
            const result = await api.getAddress()
            if (result?.address) setPublicKey(result.address)
          }
        } catch { /* not connected */ }
      }
    }
    tryReconnect()
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const api = await getApi()
      if (!api) {
        setError('Freighter wallet not detected. Please install Freighter and refresh.')
        return
      }
      const result = await api.getAddress()
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.address) {
        setPublicKey(result.address)
      }
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
    const api = await getApi()
    if (!api) throw new Error('Freighter not available')
    const networkPassphrase = import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015'
    const result = await api.signTransaction(xdr, { networkPassphrase })
    if (result?.error) throw new Error(result.error)
    return result?.signedTxXdr ?? ''
  }, [])

  return {
    publicKey,
    isConnected: !!publicKey,
    isConnecting,
    error: freighterDetected ? error : (error?.includes('not detected') ? error : null),
    connect,
    disconnect,
    signTransaction,
  }
}
