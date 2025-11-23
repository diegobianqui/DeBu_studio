# DeBu Studio Smart Contract Architecture

## Contract Relationships

```
                    ┌─────────────────────────────┐
                    │     ProviderRegistry        │
                    │  (On-Chain Provider Store)  │
                    │                             │
                    │ - registerProvider()        │
                    │ - registerSteps()           │
                    │ - getAllProviders()         │
                    │ - getProviderSteps()        │
                    └──────────┬──────────────────┘
                               │
                        references
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │   ProcessTemplate    │    │   DeBuDeployer      │
    │ (Process Blueprint)  │    │ (Factory Pattern)    │
    │                      │    │                      │
    │ - name              │    │ - deployProcess()    │
    │ - description       │    │ - getDeployed()      │
    │ - category          │    │ - providerRegistry   │
    │ - steps[] (with     │    │   reference          │
    │   provider info)    │    └──────────┬───────────┘
    │                      │              │
    │ + Step struct       │              │
    │   - name            │              │
    │   - description     │              │ creates
    │   - actionType      │              │
    │   - config          │              ▼
    │   - provider* NEW   │    ┌──────────────────────┐
    │   - providerId* NEW │    │ ProcessInstance      │
    │                      │    │ (Execution Runtime)  │
    └──────────────────────┘    │                      │
                                │ - currentStepIndex  │
                                │ - stepStates[]      │
                                │ - template ref      │
                                │                      │
                                │ NEW METHODS:        │
                                │ - executeStep()     │
                                │ - recordStepResult()│
                                │ - failStep()        │
                                │                      │
                                │ NEW EVENTS:         │
                                │ - StepExecution     │
                                │   Requested*        │
                                │ - StepCompleted*    │
                                │ - StepFailed*       │
                                │ - ProcessCompleted* │
                                └──────────────────────┘
```

---

## Data Flow Through Contracts

### 1. Provider Registration Phase

```
ProviderRegistry.registerProvider("Chainlink CRE")
    ↓
ProviderRegistry.registerSteps([
    {stepId: "cre-webhook", name: "HTTP Fetch", provider: 0x...},
    {stepId: "cre-compute", name: "Compute", provider: 0x...},
])
    ↓
✅ Provider capabilities now discoverable on-chain
```

### 2. Process Creation Phase

```
User in UI → Design Page
    ↓
Select steps including:
  - Native: "Form Submission"
  - Provider: "HTTP Fetch" from Chainlink CRE
    ↓
DeBuDeployer.deployProcess(
    name, description, category, steps[]
)
    ↓
Creates ProcessTemplate with:
  {
    name: "Expense Reimbursement",
    steps: [
      {name: "Submit", actionType: "form", provider: 0x0},
      {name: "Fetch Rate", actionType: "api-call", provider: 0x123...},
    ]
  }
    ↓
✅ Template deployed and recorded
```

### 3. Execution Phase

```
User clicks "Execute" → Frontend
    ↓
ProcessInstance.executeStep("user_data")
    ↓
contract checks:
  - currentStepIndex < template.getStepCount()
  - marks status: Executing
    ↓
if provider != address(0):
    emit StepExecutionRequested(stepIndex, provider, providerId)
        ↓
        CRE workflow listening...
        (LogTrigger catches event)
            ↓
            CRE handlers execute independently
            across multiple DON nodes
            BFT consensus verifies result
            ↓
            ProcessInstance.recordStepResult(
              stepIndex, result
            )
                ↓
                ✅ Mark status: Completed
                ✅ Emit StepCompleted event
                ✅ Increment currentStepIndex
else (native step):
    ✅ Mark status: Completed immediately
    ✅ Increment currentStepIndex
```

### 4. Result Recording Phase

```
CRE Workflow → recordStepResult(1, "0xIPFSHash123...")
    ↓
ProcessInstance stores in stepStates[1]:
  {
    status: Completed,
    actor: 0xCRESignerAddress,
    result: "0xIPFSHash123...",
    timestamp: block.timestamp,
    executionDuration: 5000  // milliseconds
  }
    ↓
Emits: StepCompleted(1, 0xCRE..., "0xIPFSHash123...")
    ↓
If currentStepIndex >= stepCount:
    emit ProcessCompleted(address(this))
    ✅ Process finished!
```

---

## State Machine: ProcessInstance Execution

```
                    ┌─────────────────────────┐
                    │ START: currentStep = 0  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ executeStep() called    │
                    │ Get step details        │
                    │ Mark: Executing        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    │                          │
        ┌───────────▼──────────┐    ┌──────────▼────────────┐
        │ Native Step          │    │ Provider Step        │
        │                      │    │                      │
        │ Complete immediately │    │ Emit event           │
        │ Mark: Completed      │    │ CRE executes        │
        │ Increment index      │    │ CRE calls            │
        │                      │    │ recordStepResult()   │
        └───────────┬──────────┘    └──────────┬───────────┘
                    │                          │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ stepStates[index] set   │
                    │ currentStepIndex++      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ More steps?             │
                    └──────┬─────────┬────────┘
                           │         │
                        YES│         │NO
                           │         │
                    ┌──────▼──┐    ┌─▼─────────────┐
                    │ Loop    │    │ ProcessComplete
                    │ (repeat)│    └────────────────┘
                    └────▲────┘
                         │
                    ┌────┴────────┐
                    │ Emit:       │
                    │ Process     │
                    │ Completed() │
                    └─────────────┘
```

---

## Provider Step Lifecycle

```
        Provider
         Register
            │
            ▼
    ┌──────────────────┐
    │ ProviderRegistry │
    │                  │
    │ - "Chainlink CRE"│
    │   - "cre-webhook"│
    │   - "cre-compute"│
    │   - "cre-write"  │
    └────────┬─────────┘
             │
      Discovered by
             │
             ▼
    ┌──────────────────┐
    │  Frontend UI     │
    │  StepBuilder     │
    │  (useProviders)  │
    └────────┬─────────┘
             │
       User selects
             │
             ▼
    ┌──────────────────┐
    │ ProcessTemplate  │
    │ Contains step:   │
    │ {                │
    │  name: "Fetch"  │
    │  provider: 0x...│
    │  providerId:    │
    │   "cre-webhook" │
    │ }               │
    └────────┬─────────┘
             │
        Deployed via
             │
             ▼
    ┌──────────────────┐
    │ DeBuDeployer     │
    └────────┬─────────┘
             │
       Instance created
             │
             ▼
    ┌──────────────────┐
    │ProcessInstance   │
    │                  │
    │ executeStep()    │
    └────────┬─────────┘
             │
      Emits: Step
      Execution
      Requested
             │
             ▼
    ┌──────────────────┐
    │   CRE Network    │
    │                  │
    │ LogTrigger →     │
    │ Callback →       │
    │ Consensus →      │
    │ recordResult()   │
    └────────┬─────────┘
             │
      Results flow back
             │
             ▼
    ┌──────────────────┐
    │ Step Completed   │
    │ Process moves to │
    │ next step        │
    └──────────────────┘
```

---

## Key Struct: Step with Provider Support

### Before (ProcessTemplate only)
```solidity
struct Step {
    string name;
    string description;
    string actionType;    // e.g., "form", "approval"
    string config;        // JSON config
}
```

### After (Provider Support Added)
```solidity
struct Step {
    string name;
    string description;
    string actionType;    // e.g., "form", "approval", "api-call"
    string config;        // JSON config
    address provider;     // ← NEW: Address of provider (0x0 for native)
    string providerId;    // ← NEW: Provider's step identifier
}
```

### Example Native Step
```javascript
{
  name: "User Approval",
  description: "Manager approves expense",
  actionType: "approval",
  config: "{\"validators\": [\"0xManager...\"]}",
  provider: address(0),        // ← Native (address 0)
  providerId: ""               // ← Empty for native
}
```

### Example Provider Step
```javascript
{
  name: "Fetch Exchange Rate",
  description: "Get latest ETH/USD rate from Chainlink",
  actionType: "api-call",
  config: "{\"url\": \"https://api.example.com/rate\"}",
  provider: 0xChainlinkCREAddress,  // ← CRE provider
  providerId: "cre-webhook"         // ← CRE's step ID
}
```

---

## Contract Interaction Summary

| Action | Caller | Contract | Function | Emits |
|--------|--------|----------|----------|-------|
| Register provider | Admin/CLI | ProviderRegistry | registerProvider() | ProviderRegistered |
| Register capabilities | Provider | ProviderRegistry | registerSteps() | StepCatalogUpdated |
| Discover providers | Frontend | ProviderRegistry | getAllProviders() | - |
| Create process | User | DeBuDeployer | deployProcess() | ProcessDeployed |
| Instantiate process | User | ProcessTemplate | instantiate() | InstanceCreated |
| Execute step | User | ProcessInstance | executeStep() | StepExecutionRequested* |
| Record result | CRE | ProcessInstance | recordStepResult() | StepCompleted* |
| Fail step | CRE/User | ProcessInstance | failStep() | StepFailed* |

*New events for CRE integration

---

## Deployment Order

```
1. ProviderRegistry
   └─ Deploy first (no dependencies)

2. ProcessTemplate (template implementation)
   └─ No dependency on ProviderRegistry
   
3. DeBuDeployer
   └─ Constructor takes: ProviderRegistry address
   
4. Register Chainlink provider
   └─ Calls: ProviderRegistry.registerProvider()
   └─ Calls: ProviderRegistry.registerSteps()

5. Deploy CRE Workflow
   └─ Copy ProcessInstance address to workflow config
   └─ Set chain selectors and RPC endpoints
   └─ Deploy to CRE network (after Early Access approval)
```

---

## Event Listening Strategy

### CRE Workflow Listens To
```solidity
event StepExecutionRequested(
    uint256 indexed stepIndex,
    address indexed provider,
    string providerId
)
```

CRE LogTrigger configuration:
```typescript
{
  chainSelector: "1",
  address: PROCESS_INSTANCE_ADDRESS,
  topics: [ethers.id("StepExecutionRequested(uint256,address,string)")]
}
```

### Frontend Listens To
```typescript
instance.on("StepCompleted", (stepIndex, actor, result) => {
  // Update execution status in real-time
});

instance.on("StepFailed", (stepIndex, reason) => {
  // Show error to user
});

instance.on("ProcessCompleted", () => {
  // Mark process as finished
});
```

---

## Storage Layout

### ProcessInstance State
```
currentStepIndex        → uint256  (current position)
template               → address  (reference to template)
initiator              → address  (who started it)
createdAt              → uint256  (timestamp)
stepStates[i]          → StepState struct array
```

### StepState
```
status                 → StepStatus (Pending/Executing/Completed/Failed)
actor                  → address    (who executed it)
result                 → string     (IPFS hash or result)
timestamp              → uint256    (when executed)
executionDuration      → uint256    (ms taken)
```

---

## Security Considerations

1. **Reentrancy**: ✅ No external calls before state change
2. **Integer Overflow**: ✅ Using uint256 safely
3. **Provider Validation**: ✅ Check provider address before routing
4. **Step Index Validation**: ✅ Verify currentStepIndex in bounds
5. **Access Control**: ⚠️ TODO: Add role-based permissions

---

This diagram shows how all contracts work together to create a decentralized, provider-based process execution system powered by Chainlink CRE. 🚀
