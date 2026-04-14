# Stellar NFT Game Marketplace

A modern, mobile-responsive NFT Game Marketplace built on the **Stellar blockchain** using **Soroban smart contracts**, React (Vite), and Tailwind CSS.

## Live Demo## Live Demo
https://web3nftmarketplace.vercel.app


## Features

- Connect **Freighter wallet** (Stellar's browser wallet)
- View owned NFTs on Stellar
- Mint new game asset NFTs via Soroban contract
- **Stake NFTs** to earn custom Stellar tokens (inter-contract calls)
- **Unstake NFTs** and claim rewards
- Real-time transaction status with toast notifications
- Fully mobile responsive

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- **@stellar/stellar-sdk** for Soroban RPC interactions
- **Freighter wallet** for transaction signing
- React Router v6
- GitHub Actions CI/CD

## Stellar Architecture

```
Frontend (React)
    ↓ @stellar/stellar-sdk
Soroban RPC Server
    ↓
┌─────────────────────────────────────┐
│  NFT Contract (ERC-721 equivalent)  │
│  Token Contract (SEP-41 token)      │
│  Staking Contract                   │
│    └─ inter-contract calls to NFT   │
│    └─ inter-contract calls to Token │
└─────────────────────────────────────┘
```

## Getting Started

### Prerequisites

1. Install [Freighter wallet](https://freighter.app) browser extension
2. Fund your testnet account at [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)

### Setup

```bash
npm install
cp .env.example .env
# Fill in your deployed Soroban contract IDs
npm run dev
```

### Deploy Soroban Contracts

```bash
# Install Stellar CLI
cargo install --locked stellar-cli

# Deploy NFT contract
stellar contract deploy --wasm nft.wasm --network testnet

# Deploy Token contract  
stellar contract deploy --wasm token.wasm --network testnet

# Deploy Staking contract
stellar contract deploy --wasm staking.wasm --network testnet
```

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_NFT_CONTRACT_ID` | Soroban NFT contract address |
| `VITE_TOKEN_CONTRACT_ID` | Soroban reward token contract address |
| `VITE_STAKING_CONTRACT_ID` | Soroban staking contract address |
| `VITE_SOROBAN_RPC_URL` | Soroban RPC endpoint |
| `VITE_NETWORK_PASSPHRASE` | Stellar network passphrase |

## CI/CD

GitHub Actions runs on every push to `main`:
- Install dependencies
- Type check
- Production build
- Verify build output

## Deployment

**Vercel**: Import repo, set framework to Vite, add env vars  
**Netlify**: Connect repo, build command `npm run build`, publish dir `dist`

## Screenshots

> Add mobile responsive screenshot here  
> Add CI/CD pipeline screenshot here

## Contract Addresses (Testnet)

> Add your deployed contract IDs here after deployment

## Transaction Hashes

> Add sample transaction hashes here after testing
