import { useState, useCallback, useEffect, useRef } from 'react'
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

// Poll for address after setAllowed() opens a new tab in Freighter v5
async function pollForAddress(
  getAddress: () => Promise<{ address: string; error?: unknown }>,
  intervalMs = 1000,
  maxAttempts = 120 // 2 minutes
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))
    try {
      const result = await getAddress()
      if (result.address) return result.address
    } catch {
      // keep polling
    }
  }
  return null
}

export function useWallet(): StellarWallet {
  const [publicKey, setPublicKey] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingMessage, setConnectingMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const pollAbortRef = useRef<boolean>(false)

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
    setConnectingMessage('Connecting...')
    setError(null)
    pollAbortRef.current = false

    // Show "check the tab" message after 2 seconds
    const hintTimer = setTimeout(() => {
      if (!pollAbortRef.current) {
        setConnectingMessage('Check the Freighter tab that opened')
      }
    }, 2000)

    try {
      const f = await getFreighter()
      if (!f) {
        setError('Freighter not found. Install from freighter.app')
        return
      }

      const { isConnected, isAllowed, setAllowed, getAddress } = f

      // Check installed
      const conn = await isConnected()
      if (!conn.isConnected) {
        setError('Freighter is not installed. Please install from freighter.app')
        return
      }

      // Check if already allowed — skip setAllowed if so
      const alreadyAllowed = await isAllowed()
      if (alreadyAllowed.isAllowed) {
        const addrResult = await getAddress()
        if (addrResult.address) {
          setPublicKey(addrResult.address)
          return
        }
      }

      // Freighter v5: setAllowed() opens a NEW TAB for the user to approve.
      // It may hang indefinitely waiting for that tab, so we race it with a
      // polling approach — whichever resolves first wins.
      let resolved = false

      const setAllowedPromise = setAllowed().then((result) => {
        if (!resolved && result.isAllowed) {
          resolved = true
          return 'allowed'
        }
        return 'denied'
      }).catch(() => 'error')

      // Concurrently poll getAddress() — once the user approves in the new
      // tab, getAddress() will start returning a value even before setAllowed
      // resolves in this tab.
      const pollPromise = (async () => {
        for (let i = 0; i < 120; i++) {
          if (pollAbortRef.current) return 'aborted'
          await new Promise((r) => setTimeout(r, 1000))
          try {
            const addr = await getAddress()
            if (addr.address) {
              resolved = true
              return addr.address
            }
          } catch { /* keep polling */ }
        }
        return null
      })()

      const winner = await Promise.race([setAllowedPromise, pollPromise])

      if (winner === 'aborted' || winner === null) {
        setError('Connection timed out. Please try again.')
        return
      }

      if (winner === 'denied' || winner === 'error') {
        setError('Please allow this app in Freighter.')
        return
      }

      // winner is either 'allowed' (from setAllowed) or an address string (from poll)
      if (winner !== 'allowed') {
        // winner is the address from polling
        setPublicKey(winner)
        return
      }

      // setAllowed resolved — now get the address
      const addrResult = await getAddress()
      if (addrResult.address) {
        setPublicKey(addrResult.address)
      } else {
        setError('Could not retrieve address from Freighter.')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message ?? 'Failed to connect Freighter')
    } finally {
      pollAbortRef.current = true
      clearTimeout(hintTimer)
      setIsConnecting(false)
      setConnectingMessage('')
    }
  }, [])

  const disconnect = useCallback(() => {
    pollAbortRef.current = true
    setPublicKey('')
    setError(null)
    setConnectingMessage('')
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
    connectingMessage,
    error,
    connect,
    disconnect,
    signTransaction,
  }
}
