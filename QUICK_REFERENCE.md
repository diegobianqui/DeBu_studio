# DeBu Studio + CRE - Quick Reference

## 📋 Files Modified/Created

### Smart Contracts
- ✅ `packages/hardhat/contracts/ProcessInstance.sol` - **ENHANCED** with CRE events
- ✅ `packages/hardhat/contracts/ProcessTemplate.sol` - Added provider fields
- ✅ `packages/hardhat/contracts/ProviderRegistry.sol` - **NEW** provider management
- ✅ `packages/hardhat/contracts/DeBuDeployer.sol` - Updated constructor
- ✅ `packages/hardhat/deploy/00_deploy_debu.ts` - Deployment order fixed

### Frontend
- ✅ `packages/nextjs/components/debu/StepBuilder.tsx` - Added provider selection
- ✅ `packages/nextjs/hooks/scaffold-eth/useProviderRegistry.ts` - **NEW** hooks
- ✅ `packages/nextjs/app/providers/page.tsx` - **NEW** provider registry UI
- ✅ `packages/nextjs/components/Header.tsx` - Added Providers nav link

### Backend/CRE
- ✅ `cre-workflows/package.json` - **NEW** CRE project
- ✅ `cre-workflows/src/debu-process-executor.ts` - **NEW** CRE workflow

### Documentation
- ✅ `CRE_INTEGRATION_ARCHITECTURE.md` - System design
- ✅ `CRE_SETUP_GUIDE.md` - Setup instructions
- ✅ `IMPLEMENTATION_SUMMARY.md` - What was built

---

## 🎯 How It Works in 3 Steps

### 1. User Creates Process
```
Design Page
  ├─ Select Process Name
  ├─ Select Category
  ├─ Add Steps
  │  ├─ Native steps (form, approval, payment)
  │  └─ Provider steps (Chainlink CRE webhooks, compute, writes)
  └─ Deploy via DeBuDeployer
```

### 2. User Executes Process
```
Execute Page
  └─ Click "Execute Step"
     └─ ProcessInstance.executeStep()
        └─ If provider step:
           └─ Emit StepExecutionRequested event
              └─ CRE LogTrigger catches event
                 └─ CRE Workflow handler invoked
                    └─ Multiple nodes execute independently
                       └─ BFT consensus verifies result
                          └─ recordStepResult() called
                             └─ ProcessInstance updated
                                └─ Frontend sees completion
```

### 3. Results Flow Back
```
CRE DON (Chainlink Network)
  └─ All nodes execute step independently
     ├─ Node 1: Call API, get result A
     ├─ Node 2: Call API, get result A
     └─ Node 3: Call API, get result A
        └─ Consensus: 3/3 match = verified ✅
           └─ Write result to ProcessInstance.recordStepResult()
              └─ Emit StepCompleted event
                 └─ Frontend updates real-time
                    └─ User sees result immediately
```

---

## 🚀 Quick Start Commands

```bash
# 1. Deploy contracts
cd debu_studio
yarn deploy --reset

# 2. Register Chainlink as provider (optional, for testing)
cd packages/hardhat
npx hardhat run scripts/registerChainlinkProvider.ts

# 3. Build CRE workflow
cd cre-workflows
npm install
npm run build

# 4. Simulate workflow locally (before production)
npm run simulate

# 5. Start dev server
cd ../..
yarn dev

# 6. Once approved, deploy to DON
cd cre-workflows
npm run deploy
```

---

## 🔌 Key Endpoints & Events

### Smart Contract Events

```solidity
// Emitted when step needs execution
event StepExecutionRequested(
  uint256 indexed stepIndex,
  address indexed provider,
  string providerId
);

// Emitted when step completes
event StepCompleted(
  uint256 indexed stepIndex,
  address indexed actor,
  string result
);

// Emitted when step fails
event StepFailed(
  uint256 indexed stepIndex,
  string reason
);

// Emitted when entire process completes
event ProcessCompleted(address indexed instance);
```

### Frontend Hooks

```typescript
import {
  useProviders,          // Get all providers
  useProviderSteps,      // Get steps for a provider
  useProviderStep,       // Get single step details
  useGetProviderByName   // Look up provider by name
} from "~/hooks/scaffold-eth";

// Usage
const { providers } = useProviders();
const { steps } = useProviderSteps(selectedProvider);
```

### API Routes (Backend)

```
GET  /api/execution/status/:processInstanceAddress
POST /api/execution/events/:processInstanceAddress
GET  /api/providers
POST /api/providers/register
```

---

## 📊 Data Flow Diagram

```
┌──────────────────┐
│  Next.js Frontend│
│  - Design Page   │
│  - Execute Page  │
│  - Providers Page│
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│  Hardhat Local / Testnet     │
│  - ProcessInstance.sol       │
│  - ProviderRegistry.sol      │
│  - Emits Events              │
└────────┬─────────────────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
┌──────────────────┐      ┌──────────────────┐
│ CRE CLI Monitor  │      │ Backend Service  │
│ (cre workflows   │      │ (Node.js)        │
│  logs)           │      │ - Listen events  │
└──────────────────┘      │ - Route steps    │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ CRE DON Network  │
                          │ - Distributed    │
                          │ - Consensus      │
                          │ - Verified       │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Write-Back to    │
                          │ ProcessInstance  │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Frontend Updates │
                          │ Real-Time Status │
                          └──────────────────┘
```

---

## 🔑 Key Concepts

### Trigger-Callback Model
- **Trigger**: Event that starts execution (e.g., `StepExecutionRequested`)
- **Callback**: Function that runs when trigger fires (CRE handler)
- **Result**: Value returned from callback (step result)

### Byzantine Fault Tolerant (BFT) Consensus
- Multiple nodes execute independently
- Results compared across nodes
- Requires agreement (e.g., 2/3) for verification
- Tolerates Byzantine (faulty/malicious) nodes

### Provider Registration Flow
```
Provider (e.g., Chainlink CRE)
  └─ registerProvider(name, description, metadata)
     └─ Added to ProviderRegistry
        └─ registerSteps(provider, stepArray)
           └─ Steps become discoverable
              └─ Frontend StepBuilder shows them
                 └─ Users can select and use
```

---

## 🧪 Testing Checklist

- [ ] Contracts compile without errors
- [ ] All tests pass: `yarn hardhat test`
- [ ] Deploy successful: `yarn deploy`
- [ ] Provider registration script runs
- [ ] CRE workflow builds: `npm run build`
- [ ] Workflow simulates locally: `npm run simulate`
- [ ] Frontend loads Design page
- [ ] Can select provider steps in StepBuilder
- [ ] Providers page shows registered providers
- [ ] Can create process with provider steps
- [ ] Can execute process (local Hardhat)
- [ ] Events emitted correctly (check logs)
- [ ] Ready for CRE DON deployment

---

## 📚 Architecture Layers

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                   │
│  Next.js UI (Design, Execute, Providers)    │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Application Layer                    │
│  React Hooks (useProviders, etc.)           │
│  Form Handlers                               │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Smart Contract Layer                 │
│  ProcessInstance, ProviderRegistry          │
│  DeBuDeployer, ProcessTemplate              │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Consensus Layer                      │
│  CRE Workflow Execution                      │
│  BFT Verification                            │
│  Multi-Node Processing                       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Backend Layer                        │
│  Event Listeners                             │
│  Provider Routers                            │
│  Execution Handlers                          │
└─────────────────────────────────────────────┘
```

---

## 🔗 Important URLs

- **CRE Dashboard**: https://cre.chain.link
- **CRE Docs**: https://docs.chain.link/cre
- **Dev Hub**: https://dev.chain.link
- **Discord**: https://discord.gg/aSK4zew
- **Mainnet RPC**: https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
- **Sepolia RPC**: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

---

## ⚙️ Environment Variables

```bash
# Smart contracts
PRIVATE_KEY=<your_private_key>
ETHERSCAN_API_KEY=<your_key>

# CRE
PROCESS_INSTANCE_ADDRESS=0x...
PROCESS_TEMPLATE_ADDRESS=0x...
CHAINLINK_PROVIDER_ADDRESS=0x...
CHAIN_SELECTOR=1

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_PROVIDER_REGISTRY=0x...
```

---

## 🎓 Learning Path

1. **Read**: `CRE_INTEGRATION_ARCHITECTURE.md`
2. **Follow**: `CRE_SETUP_GUIDE.md` step-by-step
3. **Build**: `npm run build` in cre-workflows
4. **Simulate**: `npm run simulate` locally
5. **Deploy**: `yarn deploy` contracts
6. **Test**: Create process via UI
7. **Execute**: Trigger step execution
8. **Monitor**: Check events and logs
9. **Deploy to DON**: After Early Access approval

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| CRE CLI not found | `npm install -g @chainlink/cre-cli@latest` |
| Contracts won't compile | Check Solidity version in hardhat.config.ts |
| Events not emitting | Verify ProcessInstance address and ABI |
| Workflow build fails | Check TypeScript syntax and dependencies |
| Simulation timeout | Increase timeout, check API availability |
| Can't see providers | Ensure registerProvider was called |

---

## ✅ Success Indicators

You're on track when you see:

- ✅ Contracts deploy without errors
- ✅ StepBuilder shows provider dropdown
- ✅ Providers page lists registered providers
- ✅ CRE workflow builds to WASM
- ✅ Simulation runs without errors
- ✅ Events appear in blockchain explorer
- ✅ recordStepResult called successfully
- ✅ Frontend shows step completion

---

**Status**: Ready for CRE integration! 🚀

Next step: Sign up for CRE account and follow CRE_SETUP_GUIDE.md
