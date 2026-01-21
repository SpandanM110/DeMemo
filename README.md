# DeMemo

**Decentralized AI Memory Infrastructure**

DeMemo is an enterprise-grade decentralized artificial intelligence memory layer built on the Arc Network blockchain infrastructure. The platform establishes wallet-based identity management, implements end-to-end encryption for all conversational data, and provides permanent decentralized storage through IPFS. All memory records are immutably indexed on-chain, ensuring data persistence and portability across applications.

[![DeMemo Banner](https://img.shields.io/badge/Built%20for-Agentic%20Commerce%20on%20Arc%20Hackathon-black?style=for-the-badge)](https://lablab.ai/ai-hackathons/agentic-commerce-on-arc)

## Core Features

- **Wallet-Based Authentication**: Cryptographic wallet signatures serve as primary authentication mechanism, eliminating traditional account management requirements.
- **MetaMask Integration**: Full support for MetaMask browser extension, enabling complete user self-custody of cryptographic keys.
- **Circle Wallet Support**: Integration with Circle's developer-controlled wallet infrastructure, providing seamless wallet functionality without browser extension dependencies.
- **End-to-End Encryption**: All memory data is encrypted client-side using AES-256-GCM encryption with keys cryptographically derived from wallet signatures.
- **Decentralized Storage**: Encrypted payloads are permanently stored on the InterPlanetary File System (IPFS) via Pinata's infrastructure.
- **Blockchain Indexing**: Content identifiers (CIDs) are immutably recorded on Arc Network smart contracts for permanent on-chain reference.
- **Contextual AI Integration**: Groq AI models with persistent memory context from stored conversations, supporting multiple models via Bring Your Own Key (BYOK) architecture.
- **Session Management**: Multi-session architecture allowing users to organize and manage distinct conversation threads.
- **Microtransaction Model**: Cost-effective storage pricing at 0.01 USDC per memory record stored on-chain.

## Installation and Setup

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: npm or compatible package manager
- **Browser Extension**: MetaMask browser extension (optional, for self-custody wallet access)
- **Testnet Tokens**: Arc Testnet USDC tokens (obtainable from [Circle Testnet Faucet](https://faucet.circle.com))

### Installation Procedure

#### Step 1: Repository Cloning and Dependency Installation

```bash
git clone <your-repo-url>
cd DeMemo
npm install
```

#### Step 2: Environment Configuration

Create a local environment configuration file by copying the provided template:

```bash
cp .env.example .env.local
```

Configure the following environment variables in `.env.local`:

```env
# Pinata IPFS Configuration
# Obtain JWT token from: https://app.pinata.cloud
PINATA_JWT=your_pinata_jwt

# AI Configuration (BYOK - Bring Your Own Key)
# Users provide their own Groq API key in the app Settings
# Get a free API key at: https://console.groq.com/keys
# No server-side AI key configuration needed

# Arc Network Blockchain Configuration
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_MEMORY_CONTRACT_ADDRESS=your_deployed_contract_address

# Circle Wallet Integration (Optional)
# Required only for developer-controlled wallet functionality
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
CIRCLE_WALLET_SET_ID=your_wallet_set_id
```

#### Step 3: Smart Contract Deployment

Deploy the MemoryStorage smart contract to Arc Testnet:

1. Navigate to [Remix IDE](https://remix.ethereum.org)
2. Create a new Solidity file named `MemoryStorage.sol`
3. Copy the contract source code from `src/contracts/MemoryStorage.sol`
4. Compile using Solidity compiler version 0.8.20 or higher
5. Connect MetaMask wallet to Arc Testnet network
6. Deploy the contract to Arc Testnet
7. Copy the deployed contract address to `NEXT_PUBLIC_MEMORY_CONTRACT_ADDRESS` in `.env.local`

#### Step 4: Application Execution

Start the development server:

```bash
npm run dev
```

Access the application at [http://localhost:3000](http://localhost:3000).

## Architecture and Project Structure

The DeMemo codebase follows a modular architecture with clear separation of concerns:

```
DeMemo/
├── src/
│   ├── app/                          # Next.js application directory
│   │   ├── api/                      # API route handlers
│   │   │   ├── ai/chat/route.ts      # Groq AI chat endpoint
│   │   │   ├── circle/               # Circle wallet API integration
│   │   │   └── ipfs/                 # IPFS upload and retrieval endpoints
│   │   ├── page.tsx                  # Main application entry point
│   │   ├── layout.tsx                # Root application layout
│   │   └── globals.css               # Global stylesheet
│   ├── components/                   # React UI components
│   │   ├── WalletConnect.tsx         # Wallet connection interface
│   │   ├── WalletSelector.tsx        # Wallet type selection component
│   │   ├── ChatInterface.tsx         # AI chat user interface
│   │   └── SessionSidebar.tsx        # Session management sidebar
│   ├── lib/                          # Core business logic libraries
│   │   ├── encryption.ts             # AES-256-GCM encryption implementation
│   │   ├── blockchain.ts             # Arc Network blockchain interactions
│   │   ├── wallet.ts                 # MetaMask wallet utilities
│   │   ├── circleWallet.ts           # Circle wallet integration utilities
│   │   ├── sessions.ts               # Session management logic
│   │   └── memory.ts                 # Memory orchestration and management
│   ├── contracts/                    # Smart contract source code
│   │   └── MemoryStorage.sol         # Memory storage smart contract
│   └── types/                        # TypeScript type definitions
│       └── index.ts                  # Shared type definitions
├── .env.example                      # Environment variable template
├── package.json                      # Node.js package configuration
└── README.md                         # Project documentation
```

## Technology Stack

| Component | Technology | Version/Details |
|-----------|------------|-----------------|
| **Frontend Framework** | Next.js | 15.x |
| **UI Library** | React | 19.x |
| **Language** | TypeScript | Latest stable |
| **Styling Framework** | Tailwind CSS | Latest stable |
| **Blockchain Network** | Arc Network | Testnet |
| **Blockchain Library** | ethers.js | v6.x |
| **Decentralized Storage** | Pinata IPFS | Production API |
| **AI Provider** | Groq | Multiple models (BYOK) |
| **Encryption Standard** | Web Crypto API | AES-256-GCM |
| **Wallet Providers** | MetaMask, Circle | Developer-Controlled Wallets |

## System Architecture and Workflow

The DeMemo platform operates through the following sequential workflow:

1. **Wallet Authentication**: Users authenticate by connecting either a MetaMask wallet or Circle developer-controlled wallet, establishing cryptographic identity through wallet signature verification.

2. **Session Initialization**: Users may create unlimited chat sessions, which are initially stored in browser local storage for temporary access and management.

3. **Memory Persistence**: When users elect to permanently store a conversation, they initiate the "Save to Memory" action, which triggers a microtransaction payment of 0.01 USDC.

4. **Client-Side Encryption**: Prior to storage, all conversation data undergoes client-side encryption using AES-256-GCM, with encryption keys cryptographically derived from the user's wallet signature.

5. **IPFS Storage**: The encrypted payload is uploaded to the InterPlanetary File System (IPFS) via Pinata's infrastructure, receiving a unique content identifier (CID).

6. **Blockchain Indexing**: The IPFS CID is immutably recorded on the Arc Network smart contract, creating a permanent on-chain reference to the encrypted memory.

7. **AI Context Integration**: When users engage in subsequent conversations, previously saved memories are retrieved, decrypted, and provided as contextual input to the Groq AI model, enabling personalized and contextually-aware responses.

## Smart Contract Specification

The `MemoryStorage` smart contract deployed on Arc Network provides the following functionality:

- **CID Storage**: Maintains a mapping of wallet addresses to IPFS content identifiers (CIDs) for persistent memory records
- **Payment Processing**: Implements a fixed fee structure of 0.01 USDC per memory storage operation
- **Event Emission**: Emits standardized events for off-chain indexing and monitoring purposes
- **Memory Management**: Provides functions for memory retrieval and deletion operations

## Arc Network Configuration

To interact with DeMemo, configure MetaMask with the following Arc Testnet network parameters:

| Configuration Parameter | Value |
|------------------------|-------|
| Network Name | Arc Testnet |
| RPC URL | https://rpc.testnet.arc.network |
| Chain ID | 5042002 |
| Native Currency | USDC |
| Block Explorer | https://testnet.arcscan.app |

## Development Commands

The following commands are available for development and deployment:

```bash
# Start development server with hot-reload
npm run dev

# Build optimized production bundle
npm run build

# Start production server
npm start

# Execute code linting
npm run lint
```

## Security Considerations

- All encryption operations are performed client-side using the Web Crypto API
- Private keys and wallet signatures never leave the user's browser environment
- IPFS storage contains only encrypted data; decryption keys are never transmitted
- Smart contract interactions require explicit user approval via wallet signature

## License

This software is distributed under a **Dual License Agreement** with time-based terms:

| Period | License Type | Permissions |
|--------|--------------|-------------|
| **January 9-24, 2026** (Hackathon Period) | MIT License | Use, modify, and distribute freely |
| **After January 24, 2026** | Proprietary License | All rights reserved |

During the designated hackathon period (January 9-24, 2026), this software is licensed under the MIT License, permitting unrestricted use, modification, and distribution. Effective January 25, 2026, 12:00 AM UTC, the license automatically converts to a proprietary license with all rights reserved.

For complete license terms and conditions, please refer to the [LICENSE](LICENSE) file.

## Copyright

Copyright © 2026 SpandanM110. All Rights Reserved.

---

**Acknowledgments**

This project was developed for the [Agentic Commerce on Arc Hackathon](https://lablab.ai/ai-hackathons/agentic-commerce-on-arc).
