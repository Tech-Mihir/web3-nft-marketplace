import { useState, useCallback, useEffect } from 'react'
import type { StellarWallet } from '../types'

declare global {
  interface Window {
    freighter?: unknown
    freighterApi?: unknown
  }
}

// Dynamically import @stellar/freighter-api
async function getFreighter() {
  try {
    const mod = await import('@stellar/freighter-api')
    return mod
  } catch {
    return null
  }
}

export function useWallet(): StellarWallet {
  const [publicKey, setPublicKey] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const tryReconnect = async () => {
      const freighter = await getFreighter()
      if (!freighter) return
      try {
        // Check if already connected
        const connected = await freighter.isConnected()
        const isConn = typeof connected === 'object' ? connected.isConnected : connected
        if (isConn) {
          const result = await freighter.getAddress()
          const addr = typeof result === 'object' ? result.address : result
          if (addr) setPublicKey(addr)
        }
      } catch { /* ignore */ }
    }
    tryReconnect()
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const freighter = await getFreighter()
      if (!freighter) {
        setError('Freighter not found. Please install from freighter.app')
        return
      }

      // Request access first (triggers popup in Freighter v5)
      if (typeof freighter.requestAccess === 'function') {
        const accessResult = await freighter.requestAccess()
        const addr = typeof accessResult === 'object' ? accessResult.address : accessResult
        if (addr) {
          setPublicKey(addr)
          return
        }
      }

      // Fallback: getAddress
      const result = await freighter.getAddress()
      const addr = typeof result === 'object' ? result.address : result
      if (addr) {
        setPublicKey(addr)
      } else {
        setError('Could not get address from Freighter')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message ?? 'Failed to connect')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey('')
    setError(null)
  }, [])

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    const freighter = await getFreighter()
    if (!freighter) throw new Error('Freighter not available')
    const networkPassphrase = import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015'
    const result = await freighter.signTransaction(xdr, { networkPassphrase })
    const signed = typeof result === 'object' ? result.signedTxXdr : result
    return signed ?? ''
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
