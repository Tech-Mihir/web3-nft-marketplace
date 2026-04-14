import { useState, useCallback, useEffect } from 'react'
import type { StellarWallet } from '../types'

// Freighter v5 injects window.freighterApi directly into the page
interface FreighterApi {
  isConnected: () => Promise<{ isConnected: boolean }>
  isAllowed: () => Promise<{ isAllowed: boolean }>
  setAllowed: () => Promise<{ isAllowed: boolean }>
  getUserInfo: () => Promise<{ publicKey: string; error?: string }>
  signTransaction: (xdr: string, opts?: object) => Promise<{ signedTxXdr: string; error?: string }>
}

declare global {
  interface Window {
    freighterApi?: FreighterApi
  }
}

function getApi(): FreighterApi | null {
  return window.freighterApi ?? null
}

export function useWallet(): StellarWallet {
  const [publicKey, setPublicKey] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait for Freighter to inject
    const timer = setTimeout(async () => {
      const api = getApi()
      if (!api) return
      try {
        const conn = await api.isConnected()
        if (!conn.isConnected) return
        const allowed = await api.isAllowed()
        if (!allowed.isAllowed) return
        const info = await api.getUserInfo()
        if (info.publicKey) setPublicKey(info.publicKey)
      } catch { /* ignore */ }
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const api = getApi()
      if (!api) {
        setError('Freighter not detected. Please install from freighter.app and refresh.')
        return
      }

      const conn = await api.isConnected()
      if (!conn.isConnected) {
        setError('Freighter is not connected. Please open Freighter and unlock it.')
        return
      }

      // Request permission - this triggers the Freighter popup
      const allowed = await api.setAllowed()
      if (!allowed.isAllowed) {
        setError('Permission denied. Please allow this site in Freighter.')
        return
      }

      const info = await api.getUserInfo()
      if (info.error) {
        setError(info.error)
        return
      }
      if (info.publicKey) {
        setPublicKey(info.publicKey)
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message ?? 'Connection failed. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey('')
    setError(null)
  }, [])

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    const api = getApi()
    if (!api) throw new Error('Freighter not available')
    const result = await api.signTransaction(xdr, { network: 'TESTNET' })
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
