import { useState, useCallback, useEffect } from 'react'
import {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  signTransaction as freighterSignTx,
} from '@stellar/freighter-api'
import type { StellarWallet } from '../types'

export function useWallet(): StellarWallet {
  const [publicKey, setPublicKey] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-reconnect if already allowed
  useEffect(() => {
    const tryReconnect = async () => {
      try {
        const connResult = await isConnected()
        if (!connResult.isConnected) return
        const allowedResult = await isAllowed()
        if (allowedResult.isAllowed) {
          const addrResult = await getAddress()
          if (addrResult.address) setPublicKey(addrResult.address)
        }
      } catch { /* ignore */ }
    }
    tryReconnect()
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      // Check Freighter is installed
      const connResult = await isConnected()
      if (!connResult.isConnected) {
        setError('Freighter is not installed. Please install from freighter.app')
        return
      }

      // Request access — triggers Freighter popup if not yet allowed
      const accessResult = await requestAccess()
      if (accessResult.error) {
        setError(String(accessResult.error))
        return
      }
      if (accessResult.address) {
        setPublicKey(accessResult.address)
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message ?? 'Failed to connect Freighter')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey('')
    setError(null)
  }, [])

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    const result = await freighterSignTx(xdr, { network: 'TESTNET' })
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
