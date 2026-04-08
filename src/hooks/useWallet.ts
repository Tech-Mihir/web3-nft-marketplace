import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import type { UseWalletReturn } from '../types'

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void
    }
  }
}

export function useWallet(): UseWalletReturn {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it from metamask.io')
      return
    }
    setIsConnecting(true)
    setError(null)
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum)
      await _provider.send('eth_requestAccounts', [])
      const _signer = await _provider.getSigner()
      const _account = await _signer.getAddress()
      const network = await _provider.getNetwork()
      setProvider(_provider)
      setSigner(_signer)
      setAccount(_account)
      setChainId(Number(network.chainId))
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string }
      if (e.code === 4001) {
        setError('Connection rejected by user')
      } else {
        setError(e.message ?? 'Failed to connect wallet')
      }
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
    setChainId(null)
    setProvider(null)
    setSigner(null)
    setError(null)
  }, [])

  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = async (accounts: unknown) => {
      const accs = accounts as string[]
      if (accs.length === 0) {
        disconnect()
      } else {
        setAccount(accs[0])
        if (provider) {
          const _signer = await provider.getSigner()
          setSigner(_signer)
        }
      }
    }

    const handleChainChanged = (chainIdHex: unknown) => {
      setChainId(parseInt(chainIdHex as string, 16))
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
    }
  }, [provider, disconnect])

  return {
    account,
    chainId,
    isConnected: !!account,
    isConnecting,
    error,
    connect,
    disconnect,
    provider,
    signer,
  }
}
