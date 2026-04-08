# Web3 NFT Game Marketplace

A modern, mobile-responsive Web3 NFT Game Marketplace built with React (Vite), Tailwind CSS, and ethers.js.

## Features

- Connect MetaMask wallet
- View owned NFTs (ERC-721)
- Mint new game asset NFTs
- Stake NFTs to earn ERC-20 reward tokens
- Unstake NFTs and claim rewards
- Toast notifications for all transactions
- Fully responsive (mobile, tablet, desktop)

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- ethers.js v6
- React Router v6
- fast-check (property-based testing)
- Vitest + React Testing Library

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your deployed contract addresses:

```bash
cp .env.example .env
```

```env
VITE_NFT_CONTRACT_ADDRESS=0x...
VITE_REWARD_TOKEN_ADDRESS=0x...
VITE_STAKING_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=1
```

### 3. Run development server

```bash
npm run dev
```

### 4. Run tests

```bash
npx vitest --run
```

### 5. Production build

```bash
npm run build
```

## Project Structure

```
src/
├── components/       # Shared UI components
├── hooks/            # Custom Web3 hooks
├── pages/            # Page components (Home, Dashboard, Staking)
├── contracts/        # ABIs and contract config
├── utils/            # Utility functions
└── types/            # TypeScript types
```

## Deployment

- **Vercel**: Import repo, set framework to Vite, add env vars
- **Netlify**: Connect repo, build command `npm run build`, publish dir `dist`

## CI/CD

GitHub Actions workflow runs on every push to `main`:
- Install dependencies
- Build production bundle
- Verify build output

## Smart Contracts

| Contract | Interface |
|---|---|
| NFT Contract | ERC-721 (mint, approve, tokenURI) |
| Reward Token | ERC-20 (balanceOf, decimals) |
| Staking Contract | stake, unstake, claim, pendingRewards |
