# DeBu Studio + Chainlink CRE Setup Guide

## Overview

This guide walks through setting up Chainlink CRE integration with DeBu Studio for decentralized process execution.

## Prerequisites

- **Node.js**: v18 or higher
- **Hardhat**: Already configured in `/packages/hardhat`
- **CRE CLI**: Install via `npm install -g @chainlink/cre-cli`
- **CRE Account**: Create at [cre.chain.link](https://cre.chain.link)
- **Ethereum Testnet Access**: Sepolia or similar (for testing)

## Step 1: Create CRE Account & Get CLI Access

```bash
# Visit https://cre.chain.link and create an account
# Install CRE CLI
npm install -g @chainlink/cre-cli

# Authenticate with your CRE account
cre auth login
```

## Step 2: Deploy Smart Contracts

The provider system and process execution contracts are already implemented. Deploy them:

```bash
cd packages/hardhat

# Deploy to local Hardhat network (for testing)
yarn deploy

# Or deploy to testnet
yarn deploy --network sepolia
```

Note the deployed addresses:
- **ProviderRegistry**: `0x...`
- **DeBuDeployer**: `0x...`

## Step 3: Register Chainlink as a Provider

```bash
# Create a script to register Chainlink CRE
# File: packages/hardhat/scripts/registerChainlinkProvider.ts

const providerRegistry = await ethers.getContractAt(
  "ProviderRegistry",
  PROVIDER_REGISTRY_ADDRESS
);

// Register Chainlink as provider
const tx1 = await providerRegistry.registerProvider(
  "Chainlink CRE",
  "Enterprise-grade workflow execution with BFT consensus",
  JSON.stringify({
    capabilities: ["http-fetch", "computation", "blockchain-write"],
    consensus: "BFT",
    security: "institutional-grade",
    documentation: "https://docs.chain.link/cre",
  })
);

await tx1.wait();
console.log("Chainlink CRE provider registered!");

// Register available steps/capabilities
const steps = [
  {
    stepId: "cre-webhook",
    name: "HTTP Fetch",
    description: "Consensus-verified API call with multiple independent requests",
    actionType: "api-call",
    config: JSON.stringify({
      apiUrl: "https://api.example.com/endpoint",
      method: "GET",
      timeout: 30000,
    }),
    providerName: "Chainlink CRE",
    provider: CHAINLINK_PROVIDER_ADDRESS,
  },
  {
    stepId: "cre-compute",
    name: "Computation",
    description: "Off-chain computation with results verified by consensus",
    actionType: "compute",
    config: JSON.stringify({
      formula: "x + y",
      inputs: { x: 10, y: 20 },
    }),
    providerName: "Chainlink CRE",
    provider: CHAINLINK_PROVIDER_ADDRESS,
  },
  {
    stepId: "cre-write",
    name: "Blockchain Write",
    description: "Write results back to blockchain through CRE",
    actionType: "blockchain",
    config: JSON.stringify({
      targetContract: "0x...",
      method: "recordData",
    }),
    providerName: "Chainlink CRE",
    provider: CHAINLINK_PROVIDER_ADDRESS,
  },
];

const tx2 = await providerRegistry.registerSteps(
  CHAINLINK_PROVIDER_ADDRESS,
  steps
);

await tx2.wait();
console.log(`${steps.length} Chainlink CRE capabilities registered!`);
```

Run it:
```bash
npx hardhat run scripts/registerChainlinkProvider.ts
```

## Step 4: Build CRE Workflow

```bash
cd cre-workflows

# Install dependencies
npm install

# Build the workflow (compiles to WASM)
npm run build

# The compiled binary is in ./dist/debu-process-executor.wasm
```

## Step 5: Simulate Workflow Locally

Test the workflow before deploying to production:

```bash
# Set environment variables
export PROCESS_INSTANCE_ADDRESS="0x..." # From deployment
export PROCESS_TEMPLATE_ADDRESS="0x..."
export CHAINLINK_PROVIDER_ADDRESS="0x..."
export CHAIN_SELECTOR="1" # 1 for Ethereum mainnet, adjust for testnet

# Simulate workflow execution
npm run simulate

# The simulator:
# - Makes real calls to live APIs (if configured)
# - Connects to real blockchain RPC
# - Runs the workflow logic locally
# - Allows debugging before production deployment
```

## Step 6: Deploy Workflow to DON (Early Access)

```bash
# Request Early Access at https://cre.chain.link/request-access
# Once approved, you can deploy:

cre deploy debu-process-executor

# This will:
# 1. Validate your workflow
# 2. Deploy to Chainlink's Decentralized Oracle Network (DON)
# 3. Activate automatic trigger monitoring
```

## Step 7: Test End-to-End Flow

### Create a Process with Provider Steps

```typescript
// Frontend: Design page
// 1. Select "Chainlink CRE" from provider dropdown
// 2. Select "HTTP Fetch" step
// 3. Configure API endpoint in step config
// 4. Deploy process template
```

### Instantiate and Execute

```typescript
// Frontend: Execute page
// 1. Create instance of process
// 2. Click "Execute Step"
// 3. Watch real-time execution monitor

// Backend flow:
// 1. ProcessInstance.executeStep() called
// 2. Event emitted: StepExecutionRequested
// 3. CRE catches event via LogTrigger
// 4. CRE nodes execute step independently
// 5. BFT consensus verifies results
// 6. Results written to ProcessInstance via recordStepResult()
// 7. Frontend sees completion via event listener
```

## Environment Variables

Create `.env` files in relevant directories:

### `debu_studio/.env.local`
```bash
# Contract addresses (from deployment)
NEXT_PUBLIC_PROVIDER_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_DEBU_DEPLOYER_ADDRESS=0x...

# Backend URLs
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### `cre-workflows/.env`
```bash
# CRE Configuration
PROCESS_INSTANCE_ADDRESS=0x...
PROCESS_TEMPLATE_ADDRESS=0x...
CHAINLINK_PROVIDER_ADDRESS=0x...
CHAIN_SELECTOR=1

# CRE Authentication (from `cre auth login`)
CRE_CREDENTIALS_PATH=~/.cre/credentials.json
```

## Monitoring & Debugging

### View CRE Workflow Status

```bash
# Check deployed workflows
cre workflows list

# View specific workflow logs
cre workflows logs debu-process-executor

# Get real-time metrics
cre workflows metrics debu-process-executor
```

### Monitor On-Chain Execution

```typescript
// Subscribe to step execution events
const instance = new ethers.Contract(
  processInstanceAddress,
  PROCESS_INSTANCE_ABI,
  provider
);

instance.on("StepExecutionRequested", (stepIndex, provider, providerId) => {
  console.log(`Step ${stepIndex} requested to provider ${providerId}`);
});

instance.on("StepCompleted", (stepIndex, actor, result) => {
  console.log(`Step ${stepIndex} completed by ${actor}`);
});
```

## Common Issues & Solutions

### Issue: "CRE CLI not found"
```bash
npm install -g @chainlink/cre-cli@latest
cre --version
```

### Issue: "Authentication failed"
```bash
# Re-authenticate
cre auth logout
cre auth login

# Verify credentials
cre auth status
```

### Issue: "Workflow simulation failed"
- Check environment variables are set correctly
- Verify contract addresses are valid
- Ensure API endpoints in config are accessible
- Check RPC endpoint is responding

### Issue: "DON deployment failed"
- Ensure you have Early Access approved
- Check workflow syntax and types
- Verify WASM build completed successfully
- Check logs: `cre workflows logs debu-process-executor`

## Next Steps

1. **Add More Step Types**: Extend CRE workflow with additional handlers
2. **Implement Provider Approval**: Add governance for new providers
3. **Add Monitoring Dashboard**: Real-time execution tracking UI
4. **Enable Multi-Chain**: Configure for multiple blockchains
5. **Custom Providers**: Build your own provider integrations

## Resources

- [CRE Documentation](https://docs.chain.link/cre)
- [CRE Getting Started](https://docs.chain.link/cre/getting-started/overview)
- [CRE SDK Reference](https://docs.chain.link/cre/reference/sdk)
- [DeBu Architecture](./CRE_INTEGRATION_ARCHITECTURE.md)

## Support

- **CRE Support**: [discord.gg/aSK4zew](https://discord.gg/aSK4zew)
- **DeBu Issues**: Create issue in this repository
- **Questions**: Check [CRE FAQ](https://docs.chain.link/cre/support-feedback)
