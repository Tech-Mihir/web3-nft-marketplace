import { useState, useCallback, useEffect } from 'react'
import {
  isConnected,
  isAllowed,
  setAllowed,
  getAddress,
  signTransaction as freighterSignTx,
} from '@stellar/freighter-api'
import type { StellarWallet } from '../types'

export function useWallet(): StellarWallet {
  const [publicKey, setPublicKey] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const connResult = await isConnected()
      if (!connResult.isConnected) {
        setError('Freighter is not installed. Please install from freighter.app')
        return
      }

      // setAllowed triggers the Freighter permission popup
      const allowResult = await setAllowed()
      if (!allowResult.isAllowed) {
        setError('Please allow this app in Freighter to continue.')
        return
      }

      // Now get the address
      const addrResult = await getAddress()
      if (addrResult.error) {
        setError(String(addrResult.error))
        return
      }
      if (addrResult.address) {
        setPublicKey(addrResult.address)
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
