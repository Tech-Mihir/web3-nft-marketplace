import { useState, useCallback, useEffect } from 'react'
import type { StellarWallet } from '../types'

// Use @stellar/freighter-api for reliable Freighter detection
let freighterApi: {
  isConnected: () => Promise<{ isConnected: boolean }>
  getPublicKey: () => Promise<{ publicKey: string; error?: string }>
  signTransaction: (xdr: string, opts?: object) => Promise<{ signedTxXdr: string; error?: string }>
} | null = null

async function getFreighterApi() {
  if (freighterApi) return freighterApi
  try {
    const mod = await import('@stellar/freighter-api')
    freighterApi = mod
    return freighterApi
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
      const api = await getFreighterApi()
      if (!api) return
      try {
        const { isConnected } = await api.isConnected()
        if (isConnected) {
          const result = await api.getPublicKey()
          if (result.publicKey) setPublicKey(result.publicKey)
        }
      } catch { /* not connected */ }
    }
    tryReconnect()
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const api = await getFreighterApi()
      if (!api) {
        setError('Freighter wallet is not installed. Please install it from freighter.app')
        return
      }
      const { isConnected } = await api.isConnected()
      if (!isConnected) {
        setError('Please open Freighter and connect to this site first.')
        return
      }
      const result = await api.getPublicKey()
      if (result.error) {
        setError(result.error)
        return
      }
      setPublicKey(result.publicKey)
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
    const api = await getFreighterApi()
    if (!api) throw new Error('Freighter not installed')
    const networkPassphrase = import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015'
    const result = await api.signTransaction(xdr, { networkPassphrase })
    if (result.error) throw new Error(result.error)
    return result.signedTxXdr
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
