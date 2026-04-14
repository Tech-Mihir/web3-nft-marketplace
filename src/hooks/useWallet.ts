import { useState, useCallback, useEffect } from 'react'
import type { StellarWallet } from '../types'

interface FreighterApi {
  isConnected: () => Promise<{ isConnected: boolean }>
  isAllowed: () => Promise<{ isAllowed: boolean }>
  setAllowed: () => Promise<{ isAllowed: boolean }>
  getUserInfo: () => Promise<{ publicKey: string; error?: string }>
  getAddress: () => Promise<{ address: string; error?: string }>
  requestAccess: () => Promise<{ address: string; error?: string }>
  signTransaction: (xdr: string, opts?: object) => Promise<{ signedTxXdr: string; error?: string }>
}

declare global {
  interface Window {
    freighterApi?: FreighterApi
  }
}

// Try window injection first, then npm package fallback
async function getApiAsync(): Promise<FreighterApi | null> {
  // Wait up to 3s for Freighter to inject window.freighterApi
  for (let i = 0; i < 30; i++) {
    if (window.freighterApi) return window.freighterApi
    await new Promise(r => setTimeout(r, 100))
  }
  // Fallback: npm package
  try {
    const mod = await import('@stellar/freighter-api')
    return mod as unknown as FreighterApi
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
      const api = await getApiAsync()
      if (!api) return
      try {
        const conn = await api.isConnected()
        if (!conn.isConnected) return
        const allowed = await api.isAllowed()
        if (!allowed.isAllowed) return
        // Try getUserInfo first, fallback to getAddress
        if (api.getUserInfo) {
          const info = await api.getUserInfo()
          if (info?.publicKey) { setPublicKey(info.publicKey); return }
        }
        if (api.getAddress) {
          const addr = await api.getAddress()
          if (addr?.address) setPublicKey(addr.address)
        }
      } catch { /* ignore */ }
    }
    tryReconnect()
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const api = await getApiAsync()
      if (!api) {
        setError('Freighter not detected. Please install from freighter.app and refresh.')
        return
      }

      const conn = await api.isConnected()
      if (!conn.isConnected) {
        setError('Freighter is not connected. Please open and unlock Freighter.')
        return
      }

      // Try requestAccess first (triggers popup), fallback to setAllowed
      let address = ''
      if (api.requestAccess) {
        const result = await api.requestAccess()
        if (result?.address) { address = result.address }
        else if (result?.error) { setError(String(result.error)); return }
      }

      if (!address && api.setAllowed) {
        const allowed = await api.setAllowed()
        if (!allowed.isAllowed) { setError('Please allow this site in Freighter.'); return }
        if (api.getUserInfo) {
          const info = await api.getUserInfo()
          if (info?.publicKey) address = info.publicKey
        } else if (api.getAddress) {
          const addr = await api.getAddress()
          if (addr?.address) address = addr.address
        }
      }

      if (address) {
        setPublicKey(address)
      } else {
        setError('Could not get address. Please try again.')
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
    const api = await getApiAsync()
    if (!api) throw new Error('Freighter not available')
    const result = await api.signTransaction(xdr, { network: 'TESTNET' })
    if (result?.error) throw new Error(String(result.error))
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
