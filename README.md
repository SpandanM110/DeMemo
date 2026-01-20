# DeMemo

**Decentralized AI Memory**

DeMemo is a decentralized AI memory layer built on Arc Network. Your wallet is your identity, your conversations are encrypted and stored on IPFS, and your memories follow you everywhere.

[![DeMemo Banner](https://img.shields.io/badge/Built%20for-Agentic%20Commerce%20on%20Arc%20Hackathon-black?style=for-the-badge)](https://lablab.ai/ai-hackathons/agentic-commerce-on-arc)

## Features

- **Wallet-Based Identity**: Your wallet is your login. No accounts needed.
- **MetaMask Support**: Connect your own wallet for full self-custody.
- **Circle Wallets**: Developer-controlled wallets - no browser extension needed.
- **End-to-End Encryption**: Memories are encrypted with keys derived from your wallet signature.
- **Permanent Storage**: Encrypted data stored on IPFS via Pinata.
- **Blockchain Indexed**: Memory CIDs recorded on Arc Network smart contract.
- **AI with Memory**: Chat with Gemini AI that remembers your previous conversations.
- **Session Management**: Create multiple chat sessions, save what matters.
- **Micro Payments**: Pay just 0.01 USDC per memory stored.

## Quick Start

### Prerequisites

- Node.js 18+
- MetaMask browser extension (optional)
- Arc Testnet USDC (get from [faucet.circle.com](https://faucet.circle.com))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd DeMemo
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```env
# Pinata (IPFS) - Get from https://app.pinata.cloud
PINATA_JWT=your_pinata_jwt

# Gemini AI - Get from https://aistudio.google.com
GEMINI_API_KEY=your_gemini_key

# Arc Network
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_MEMORY_CONTRACT_ADDRESS=your_deployed_contract

# Circle (Optional - for developer-controlled wallets)
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
CIRCLE_WALLET_SET_ID=your_wallet_set_id
```

### 3. Deploy Smart Contract

1. Go to [Remix IDE](https://remix.ethereum.org)
2. Create new file `MemoryStorage.sol`
3. Copy contents from `src/contracts/MemoryStorage.sol`
4. Compile with Solidity 0.8.20+
5. Connect MetaMask to Arc Testnet
6. Deploy contract
7. Copy contract address to `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
DeMemo/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/chat/route.ts      # Gemini AI endpoint
│   │   │   ├── circle/               # Circle wallet API
│   │   │   └── ipfs/                 # IPFS upload/retrieve
│   │   ├── page.tsx                  # Main application
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── WalletConnect.tsx         # Wallet connection UI
│   │   ├── WalletSelector.tsx        # Wallet type selector
│   │   ├── ChatInterface.tsx         # AI chat interface
│   │   └── SessionSidebar.tsx        # Session management
│   ├── lib/
│   │   ├── encryption.ts             # AES-256-GCM encryption
│   │   ├── blockchain.ts             # Arc Network interaction
│   │   ├── wallet.ts                 # MetaMask utilities
│   │   ├── circleWallet.ts           # Circle wallet utilities
│   │   ├── sessions.ts               # Session management
│   │   └── memory.ts                 # Memory orchestration
│   ├── contracts/
│   │   └── MemoryStorage.sol         # Smart contract
│   └── types/
│       └── index.ts                  # TypeScript definitions
├── .env.example                      # Environment template
├── package.json
└── README.md
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS |
| Blockchain | Arc Network, ethers.js v6 |
| Storage | Pinata IPFS |
| AI | Google Gemini 1.5 Flash |
| Encryption | Web Crypto API (AES-256-GCM) |
| Wallets | MetaMask, Circle Developer-Controlled Wallets |

## How It Works

1. **Connect Wallet**: Use MetaMask or Circle Wallet to sign in.

2. **Chat Freely**: Create unlimited chat sessions stored locally in your browser.

3. **Save to Memory**: When you want to keep a conversation forever, click "Save to Memory" and pay 0.01 USDC.

4. **Encryption**: Your conversation is encrypted client-side using a key derived from your wallet signature.

5. **Storage**: Encrypted data is uploaded to IPFS via Pinata.

6. **Blockchain**: The IPFS CID is recorded on Arc Network's smart contract.

7. **AI Context**: Saved memories are loaded and provided as context to the AI for personalized responses.

## Smart Contract

The `MemoryStorage` contract on Arc Network:

- Stores IPFS CIDs for each wallet address
- Charges 0.01 USDC per memory
- Emits events for easy indexing
- Supports memory retrieval and deletion

## Arc Network Configuration

Add Arc Testnet to MetaMask:

| Setting | Value |
|---------|-------|
| Network Name | Arc Testnet |
| RPC URL | https://rpc.testnet.arc.network |
| Chain ID | 5042002 |
| Currency | USDC |
| Explorer | https://testnet.arcscan.app |

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## License

**Dual License** - Time-Based

| Period | License | Permissions |
|--------|---------|-------------|
| **Jan 9-24, 2026** (Hackathon) | MIT | ✅ Use, modify, distribute freely |
| **After Jan 24, 2026** | Proprietary | ❌ All rights reserved |

During the hackathon period, this software is open source under MIT License.
After January 24, 2026, it converts to a proprietary license.

See the [LICENSE](LICENSE) file for full details.

© 2026 SpandanM110

---

Built for the [Agentic Commerce on Arc Hackathon](https://lablab.ai/ai-hackathons/agentic-commerce-on-arc).
