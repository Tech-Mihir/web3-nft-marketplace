import { useState, useCallback, useEffect } from 'react'
import type { StellarWallet } from '../types'

// Freighter API - loaded dynamically to avoid SSR issues
let _freighter: typeof import('@stellar/freighter-api') | null = null

async function getFreighter() {
  if (_freighter) return _freighter
  try {
    _freighter = await import('@stellar/freighter-api')
    return _freighter
  } catch {
    return null
  }
}

export function useWallet(): StellarWallet {
  const [publicKey, setPublicKey] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-reconnect on load
  useEffect(() => {
    const tryReconnect = async () => {
      const f = await getFreighter()
      if (!f) return
      try {
        const { isConnected, isAllowed, getAddress } = f
        const conn = await isConnected()
        if (!conn.isConnected) return
        const allowed = await isAllowed()
        if (!allowed.isAllowed) return
        const addr = await getAddress()
        if (addr.address) setPublicKey(addr.address)
      } catch { /* ignore */ }
    }
    tryReconnect()
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const f = await getFreighter()
      if (!f) {
        setError('Freighter not found. Install from freighter.app')
        return
      }

      const { isConnected, setAllowed, getAddress } = f

      // Check installed
      const conn = await isConnected()
      if (!conn.isConnected) {
        setError('Freighter is not installed. Please install from freighter.app')
        return
      }

      // setAllowed triggers the Freighter permission popup
      const allowResult = await Promise.race([
        setAllowed(),
        new Promise<{ isAllowed: boolean }>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 30000)
        ),
      ])

      if (!allowResult.isAllowed) {
        setError('Please allow this app in Freighter.')
        return
      }

      // Get address after permission granted
      const addrResult = await getAddress()
      if (addrResult.address) {
        setPublicKey(addrResult.address)
      } else {
        setError('Could not retrieve address from Freighter.')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      if (e.message === 'timeout') {
        setError('Connection timed out. Please try again.')
      } else {
        setError(e.message ?? 'Failed to connect Freighter')
      }
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey('')
    setError(null)
  }, [])

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    const f = await getFreighter()
    if (!f) throw new Error('Freighter not available')
    const result = await f.signTransaction(xdr, { network: 'TESTNET' })
    if (result.error) throw new Error(String(result.error))
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
