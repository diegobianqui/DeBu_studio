# 🏛️ DeBu Studio

**The Decentralized Bureaucracy Studio**

"Institutions are made of the processes they define, adopt, and operate."
DeBu Studio is a blockchain-based platform for designing, deploying, and executing standardized processes on-chain. It transforms traditional administrative workflows into transparent, immutable, and auditable smart contracts.
This is a re-interpretation of the concept of Decentralized Bureaucracy that aims to support a **Decentralized Institutional Design**, offering a platform for the meritocratic selection of the most efficient processes, measured by adoption/usage rather than staking or other ownership and wealth-based mechanisms, as DAOs do (see this [Article](https://tr.tradingview.com/news/u_today:0cd602dbc094b:0-vitalik-buterin-names-four-reasons-why-ethereum-needs-better-daos/)).

## 🎯 Overview

DeBu Studio enables organizations and individuals to:
- **Design** custom process templates with multiple steps and configurable logic
- **Deploy** these templates as immutable smart contracts on the blockchain
- **Execute** process instances with full transparency and traceability
- **Track** every step of a bureaucratic workflow on-chain

Whether it's public administration, private sector workflows, supply chain processes, or any other multi-step procedure, DeBu Studio provides the infrastructure to make them decentralized and transparent.

## ✨ Key Features

### Process Design
- Create custom process blueprints with multiple steps
- Configure step types (forms, approvals, payments, etc.)
- Define validation rules and schemas for each step
- Categorize processes for easy discovery

### Process Deployment
- Deploy process templates as smart contracts
- Immutable process definitions stored on-chain
- Factory pattern for efficient deployment via `DeBuDeployer`
- Event-indexed for easy frontend querying

### Process Execution
- Instantiate process templates for individual use cases
- Execute steps sequentially with data submission
- Support for payment-enabled steps
- Track process state and completion status
- Full audit trail of actors and timestamps

### Browse & Discover
- Browse all deployed process templates
- Filter by category, name, or address
- View process details including steps and descriptions
- Instantiate processes directly from the browser

## 🏗️ Architecture

### Smart Contracts

#### `DeBuDeployer.sol`
Factory contract for deploying new process templates. Maintains a registry of all deployed processes.

#### `ProcessTemplate.sol`
Immutable blueprint defining:
- Process metadata (name, description, category, version)
- Step definitions with configuration
- Instance creation functionality
- Per-user instance tracking

#### `ProcessInstance.sol`
Represents a running instance of a process with:
- Reference to parent template
- Current step tracking
- Step state management (pending, completed, rejected)
- Actor and timestamp recording
- Payment support for fee-based steps

### Frontend Application

Built with **Scaffold-ETH 2**, the frontend provides:
- **Home**: Landing page with quick navigation
- **Design**: Interface for creating new process templates
- **Browse**: Explore and instantiate existing processes
- **Execute**: Step-by-step process execution interface
- **Block Explorer**: On-chain data inspection

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.18.3
- Yarn 3.2.3
- A Web3 wallet (MetaMask, WalletConnect, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/diegobianqui/DeBu_studio.git
cd DeBu_studio/debu_studio
```

2. Install dependencies:
```bash
yarn install
```

3. Start a local blockchain:
```bash
yarn chain
```

4. Deploy the contracts (in a new terminal):
```bash
yarn deploy
```

5. Start the frontend (in a new terminal):
```bash
yarn start
```

6. Open your browser and navigate to:
```
http://localhost:3000
```

## 🛠️ Development

### Available Commands

- `yarn chain` - Start local Hardhat network
- `yarn deploy` - Deploy contracts to the local network
- `yarn start` - Start the Next.js development server
- `yarn compile` - Compile smart contracts
- `yarn test` - Run contract tests
- `yarn lint` - Lint all code
- `yarn format` - Format all code

### Project Structure

```
debu_studio/
├── packages/
│   ├── hardhat/          # Smart contracts & deployment
│   │   ├── contracts/    # Solidity contracts
│   │   ├── deploy/       # Deployment scripts
│   │   └── test/         # Contract tests
│   └── nextjs/           # Frontend application
│       ├── app/          # Next.js app routes
│       ├── components/   # React components
│       │   └── debu/     # DeBu-specific components
│       ├── hooks/        # Custom React hooks
│       └── contracts/    # Contract ABIs & addresses
```

## 🎨 Technology Stack

- **Smart Contracts**: Solidity
- **Blockchain**: Ethereum (EVM-compatible)
- **Development Framework**: Hardhat
- **Frontend**: Built with Scaffold-ETH 2 (Next.js, React, TypeScript)
- **Styling**: Tailwind CSS, DaisyUI
- **Web3 Integration**: wagmi, viem
- **Wallet Connection**: RainbowKit

## 🔐 Security Considerations

- Process templates are immutable once deployed
- Process instances track all actors and timestamps
- Payment functionality requires appropriate access controls
- Consider implementing role-based permissions for production use
- Audit contracts before mainnet deployment

## 🗺️ Use Cases

- **Public Administration**: Permit applications, license renewals, civic processes
- **Private Administration**: HR workflows, approval chains, procurement
- **Supply Chain**: Product tracking, quality checks, handoff procedures
- **Legal**: Contract workflows, compliance processes
- **Finance**: Payment processing, reimbursements, budget approvals

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](debu_studio/CONTRIBUTING.md) for details on how to contribute to this project.

## 🌟 Acknowledgments

Built with [Scaffold-ETH 2](https://scaffoldeth.io/) - A modern, clean, and extensible toolkit for Ethereum development.

---

**Made with ❤️ for transparent and efficient bureaucracy**
