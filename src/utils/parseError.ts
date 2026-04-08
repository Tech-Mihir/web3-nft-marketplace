/**
 * Parses blockchain/ethers.js errors into user-friendly messages.
 */
export function parseTransactionError(error: unknown): string {
  if (error === null || error === undefined) return 'An unknown error occurred'

  const err = error as Record<string, unknown>

  // User rejected transaction (MetaMask code 4001)
  if (err.code === 4001 || (typeof err.message === 'string' && err.message.includes('user rejected'))) {
    return 'Transaction cancelled by user'
  }

  // Insufficient funds for gas
  if (typeof err.message === 'string' && err.message.includes('insufficient funds')) {
    return 'Insufficient funds for gas fee'
  }

  // Contract revert with reason
  if (typeof err.reason === 'string' && err.reason.length > 0) {
    return `Transaction failed: ${err.reason}`
  }

  // ethers v6 revert data
  if (typeof err.revert === 'object' && err.revert !== null) {
    const revert = err.revert as Record<string, unknown>
    if (typeof revert.args === 'object' && Array.isArray(revert.args) && revert.args.length > 0) {
      return `Transaction failed: ${revert.args[0]}`
    }
  }

  // Generic error message
  if (typeof err.message === 'string') return err.message

  return 'An unknown error occurred'
}
