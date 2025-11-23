# DeBu Studio + Chainlink CRE Integration Architecture

## Overview

This document outlines how DeBu Studio integrates with Chainlink's Confidential Runtime Environment (CRE) to create a decentralized bureaucratic process execution platform with enterprise-grade security.

## Key Components

### 1. Smart Contract Layer (On-Chain)

**ProcessInstance.sol** (extends existing)
- Stores process execution state
- Records step execution history with provider references
- Emits events for step initiation and completion
- Tracks execution status: pending → executing → completed/failed

**ProviderRegistry.sol** (already created)
- Chainlink registers itself as a provider with available capabilities
- Example registration:
  ```
  Provider: "Chainlink CRE"
  Steps:
  - id: "cre-webhook", name: "HTTP Fetch", actionType: "api-call"
  - id: "cre-compute", name: "Computation", actionType: "compute"
  - id: "cre-write", name: "Chain Write", actionType: "blockchain"
  ```

### 2. CRE Workflow Layer (Off-Chain Execution)

**CRE Workflow for DeBu**
- **Trigger**: EVM log event from ProcessInstance (step execution requested)
- **Callback**: 
  1. Fetch step details from ProcessInstance contract
  2. Execute step-specific business logic (API calls, computations, etc.)
  3. Write results back to ProcessInstance
  4. Emit completion event

```
cre.Handler(
  ProcessInstanceStepTriggered,  // Trigger: when step needs execution
  executeProcessStep,             // Callback: execute the step
)
```

### 3. Backend Service Layer (Node.js/TypeScript)

**Purpose**: Bridge between on-chain requests and CRE execution

**Responsibilities**:
- Listen for ProcessInstance step execution events
- Maintain provider registry cache
- Route step executions to appropriate handlers
- Monitor CRE workflow execution status
- Provide execution status API to frontend

### 4. Frontend Layer (Next.js)

**New Components**:
- Execution monitor showing step status in real-time
- Provider step selection UI (already created in StepBuilder)
- Process execution dashboard

## Integration Flow

### Step 1: User Creates Process with Provider Steps

```
User designs process in Design page
→ Selects Chainlink CRE provider for some steps
→ Creates ProcessTemplate with steps containing provider addresses
→ Deploys template via DeBuDeployer
```

### Step 2: User Instantiates Process

```
User creates ProcessInstance via instantiate()
→ Frontend shows execution UI
→ Backend listens for step execution events
```

### Step 3: Backend Triggers Step Execution

```
User clicks "Execute Step" on frontend
→ Frontend calls ProcessInstance.executeStep(stepIndex)
→ ProcessInstance emits "StepExecutionRequested" event
→ CRE Workflow triggered by EVM log
```

### Step 4: CRE Executes Step

```
CRE catches ProcessInstanceStepTriggered event
→ Callback invoked on CRE nodes
→ Fetch step details, provider, and action type
→ Route to provider-specific handler (HTTP fetch, compute, etc.)
→ Each node executes independently
→ Consensus protocol verifies results
→ Write result back to ProcessInstance.recordStepResult()
→ Emit "StepExecutionCompleted" event
```

### Step 5: Frontend Updates

```
Backend listens for StepExecutionCompleted event
→ Updates real-time execution dashboard
→ Notifies user via WebSocket/polling
→ Allows proceeding to next step or viewing results
```

## Chainlink CRE Workflow Example

```typescript
// File: workflows/debu-process-executor.ts
import * as cre from "@chainlink/cre-sdk";
import { ethers } from "ethers";

interface ProcessStepPayload {
  processInstanceAddress: string;
  stepIndex: number;
  stepProvider: string;
  providerId: string;
}

cre.Handler(
  cre.evm.LogTrigger({
    chainSelector: "1", // Mainnet
    address: process.env.PROCESS_INSTANCE_ADDRESS,
    topics: [
      ethers.id("StepExecutionRequested(address,uint256)"),
    ],
  }),
  async (config, runtime, trigger) => {
    try {
      // Connect to blockchain
      const provider = runtime.evm.getProvider();
      const signer = runtime.evm.getSigner();

      // Fetch step details from contract
      const instance = new ethers.Contract(
        trigger.log.address,
        PROCESS_INSTANCE_ABI,
        provider
      );

      const currentStep = await instance.getCurrentStep();
      const stepDetails = await instance.getStep(currentStep.stepIndex);

      // Route to provider-specific executor
      let result;
      if (stepDetails.providerId === "cre-webhook") {
        result = await executeHttpFetch(stepDetails, runtime);
      } else if (stepDetails.providerId === "cre-compute") {
        result = await executeComputation(stepDetails, runtime);
      }

      // Write result back to chain
      const tx = await instance
        .connect(signer)
        .recordStepResult(currentStep.stepIndex, result);

      await tx.wait();

      return { success: true, resultHash: result.hash };
    } catch (error) {
      console.error("Step execution failed:", error);
      return { success: false, error: error.message };
    }
  }
);

async function executeHttpFetch(step, runtime) {
  // Use CRE's HTTP client for consensus-verified API calls
  const response = await runtime.http.get({
    url: step.config.apiUrl,
    headers: step.config.headers,
  });
  return response.data;
}

async function executeComputation(step, runtime) {
  // Custom computation logic using step.config
  const computation = JSON.parse(step.config);
  // ... your computation logic ...
  return result;
}
```

## Provider Registration Flow

### Chainlink CRE Provider Setup

```typescript
// Register CRE as provider
const chainlink = {
  name: "Chainlink CRE",
  address: process.env.CHAINLINK_PROVIDER_ADDRESS,
  description: "Enterprise-grade workflow execution with consensus",
  metadata: {
    capabilities: ["http-fetch", "computation", "blockchain-write"],
    consensus: "BFT",
    security: "institutional-grade",
  },
  steps: [
    {
      stepId: "cre-webhook",
      name: "HTTP Fetch",
      description: "Consensus-verified API call",
      actionType: "api-call",
      config: JSON.stringify({
        apiUrl: "https://example.com/api",
        method: "GET",
        timeout: 30000,
      }),
    },
    // ... more steps
  ],
};

// Call on ProviderRegistry
await providerRegistry.registerProvider(
  chainlink.name,
  chainlink.description,
  JSON.stringify(chainlink.metadata)
);

// Register available steps
await providerRegistry.registerSteps(
  chainlink.address,
  chainlink.steps
);
```

## Backend Service API

```typescript
// packages/backend/src/services/execution-service.ts

class ExecutionService {
  // Listen for step execution requests
  async startListening() {
    // Watch ProcessInstance events
    instance.on("StepExecutionRequested", (address, stepIndex) => {
      this.handleStepRequest(address, stepIndex);
    });
  }

  // Route step to appropriate handler
  async executeStep(processInstance, stepIndex) {
    const step = await processInstance.getStep(stepIndex);
    
    if (step.provider === ADDRESS_ZERO) {
      // Native step - execute locally
      return this.executeNativeStep(step);
    } else if (step.provider === CHAINLINK_CRE_ADDRESS) {
      // CRE step - let CRE handle it
      // Backend monitors for completion
      return this.monitorCREExecution(processInstance, stepIndex);
    }
  }

  // Provide execution status API
  async getExecutionStatus(processInstanceAddress) {
    return {
      currentStep: index,
      stepStatus: "executing", // pending, executing, completed, failed
      provider: "Chainlink CRE",
      startedAt: timestamp,
      estimatedCompletion: timestamp + duration,
    };
  }
}
```

## Summary

This architecture creates a seamless bridge between:

1. **On-Chain**: DeBu Studio processes and execution state
2. **Off-Chain**: CRE workflows that execute steps with enterprise security
3. **Frontend**: Real-time status monitoring and user interaction

The key innovation is that **provider steps are composable microservices** orchestrated by CRE, enabling:
- ✅ Institutional-grade security via BFT consensus
- ✅ Cross-chain and off-chain data integration
- ✅ Decentralized execution without trusted intermediaries
- ✅ Real-time verification and auditability
- ✅ Flexible provider ecosystem

## Next Steps

1. Create CRE workflow file with step execution handlers
2. Build backend service to listen for events
3. Deploy CRE workflow to DON (Early Access)
4. Update ProcessInstance contract to emit execution events
5. Create execution monitoring UI
