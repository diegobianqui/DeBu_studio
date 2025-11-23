# Custom Steps Testing Guide

## Overview

This guide walks you through testing the new **Approval** and **Payment** step types in the DeBu (Decentralized Bureaucracy) application.

## Prerequisites

✅ **Hardhat Chain Running**: Chain should be running on port 8545
```bash
cd packages/hardhat && yarn hardhat node
```

✅ **Contracts Deployed**: Run deployment with reset
```bash
yarn deploy --reset
```
- DeBuDeployer deployed to: `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6`
- StepHandlers deployed to: `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318`

✅ **Frontend Running**: Start the dev server
```bash
cd packages/nextjs && yarn dev
```

✅ **Wallet Connected**: 
- Navigate to http://localhost:3000
- Connect wallet using Hardhat network (chain 31337)
- You'll have test ETH available

---

## Test Case 1: Create Process with Approval Step

### Step 1: Navigate to Design Page
1. Go to **Design** section (http://localhost:3000/design)
2. Fill in process information:
   - **Name**: "Expense Report Approval"
   - **Description**: "Manager approval for expense claims"
   - **Category**: "Private Administration"

### Step 2: Add Approval Step
1. Click **"Add New Step"** section on the right
2. Fill in:
   - **Name**: "Manager Review"
   - **Description**: "Waiting for manager's approval"
   - **Type**: Select **"Approval"** from dropdown
3. Click **"Add Step"** button
4. Verify the step appears in the visualization area with "approval" badge

### Step 3: Add Second Step (Optional)
You can add more steps after approval:
- Name: "Final Processing"
- Type: "Form Input"

### Step 4: Deploy Process
1. Click **"Deploy Process Blueprint"** button
2. Confirm transaction in wallet
3. Wait for confirmation
4. You should see: "Process deployed successfully!"

---

## Test Case 2: Execute Approval Step

### Step 1: Navigate to Browse
1. Go to **Browse** section (http://localhost:3000/browse)
2. Find the "Expense Report Approval" process you just created
3. Click the **expand arrow** on the left of the row

### Step 2: Start New Instance
1. In the expanded section, click **"Start New"** button
2. Confirm the transaction
3. Wait for confirmation and redirect to Execute page

### Step 3: Execute Approval Step
1. You should now see the instance on the **Execute** page
2. The step should show:
   - **Title**: "Manager Review"
   - **Description**: "Waiting for manager's approval"
   - **Alert**: "Wallet Signature Required - You will be asked to sign with your connected wallet"

3. **Optional Note Field**: 
   - You can add an optional IPFS hash or comment (leave blank is fine)
   
4. Click **"Sign & Approve"** button
5. The button changes to show:
   - Loading spinner
   - Status: "⏳ Waiting for confirmation..."

### Step 4: Verify Approval Completion
1. After 2 seconds, the step counter should update
2. If there are more steps, you'll see the next step form
3. If this was the last step, you'll see: "Process successfully completed! 🎉"

---

## Test Case 3: Create Process with Payment Step

### Step 1: Navigate to Design
1. Go to **Design** section
2. Fill in process information:
   - **Name**: "Equipment Purchase Order"
   - **Description**: "Approval and payment for new equipment"
   - **Category**: "Supply Chain"

### Step 2: Add Form Step (Optional)
You can add a form step first:
- Name: "Equipment Details"
- Type: "Form Input"

### Step 3: Add Payment Step
1. In **"Add New Step"** section:
   - **Name**: "Payment Processing"
   - **Description**: "Please send payment in ETH"
   - **Type**: Select **"Payment"** from dropdown
2. Click **"Add Step"**
3. Verify the step appears with "payment" badge

### Step 4: Deploy Process
1. Click **"Deploy Process Blueprint"**
2. Confirm transaction
3. Wait for "Process deployed successfully!"

---

## Test Case 4: Execute Payment Step

### Step 1: Start New Instance
1. Go to **Browse**
2. Find "Equipment Purchase Order" process
3. Click expand, then **"Start New"**
4. Confirm transaction

### Step 2: Complete First Step (if you added form)
If you added a form step:
1. Enter any data (e.g., "equipment info")
2. Click "Complete Step"
3. Wait for confirmation

### Step 3: Execute Payment Step
1. On the Execute page, you should now see the Payment step
2. The interface shows:
   - **Alert**: "Payment Required (1 ETH = $2,500 USD)"
   - **Amount Input**: Field asking for USD amount

3. **Enter an amount** (e.g., "100.50" for $100.50)
4. The form automatically calculates:
   - Exchange Rate: 1 ETH = $2,500
   - **ETH to Send**: Shows calculated value (e.g., 0.040200 ETH for $100.50)

### Step 4: Verify Conversion Math
- For $100.50:
  - Calculation: 100.50 / 2500 = 0.0402 ETH
  - Displayed: 0.040200 ETH ✓

- For $2500:
  - Calculation: 2500 / 2500 = 1.0 ETH
  - Displayed: 1.000000 ETH ✓

### Step 5: Send Payment
1. Click **"Send Payment"** button
2. Confirm the transaction with the calculated ETH amount
3. Button shows:
   - Loading spinner
   - Status: "⏳ Waiting for confirmation..."

### Step 6: Verify Payment Processed
1. After 2 seconds:
   - Step counter updates
   - If this was the last step: "Process successfully completed! 🎉"
2. The ETH was transferred from your wallet to the StepHandlers contract

---

## Test Case 5: Mixed Process (Form + Approval + Payment)

### Create a Complex Process
1. **Design Page**:
   - Process Name: "Full Procurement Process"
   - Add 3 steps:
     - Step 1: Type "Form" - "Submit Requirements"
     - Step 2: Type "Approval" - "Manager Review"
     - Step 3: Type "Payment" - "Process Payment"

2. Deploy the process

### Execute the Process
1. Browse → Find process → Expand → Start New
2. Execute Page:
   - **Step 1 (Form)**: Enter requirements data
   - **Step 2 (Approval)**: Sign with wallet (no payment)
   - **Step 3 (Payment)**: Enter USD amount and send ETH
   - Final: "Process successfully completed! 🎉"

---

## Troubleshooting

### Issue: "Contract Not Found" Error
**Solution**: 
- Ensure wallet is connected to Hardhat network (chain 31337)
- Run `yarn deploy --reset` again
- Refresh the page

### Issue: Payment Conversion Shows 0 ETH
**Solution**:
- Ensure StepHandlers contract address is correct in InstanceCard.tsx
- Check that the payment amount is entered correctly
- The form should update after you finish typing

### Issue: Transaction Fails
**Solution**:
- Check that you have sufficient ETH in your wallet
- Ensure Hardhat chain is still running
- Try refreshing the page and retrying

### Issue: Waiting for confirmation takes too long
**Solution**:
- Default wait is 2 seconds - can be increased in InstanceCard.tsx
- Check browser console for any error messages
- Ensure transactions are being mined in Hardhat

---

## Advanced Testing

### Check Contract State
You can verify the payments were received:

```bash
# In Hardhat console
const stepHandlers = await ethers.getContractAt("StepHandlers", "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318")
const balance = await ethers.provider.getBalance("0x8A791620dd6260079BF849Dc5567aDC3F2FdC318")
console.log("StepHandlers balance:", ethers.formatEther(balance))
```

### Test USD to Wei Conversion
```bash
const stepHandlers = await ethers.getContractAt("StepHandlers", "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318")

# Test conversion for $100.50 (10050 cents)
const wei = await stepHandlers.convertUsdToWei(10050n)
console.log("$100.50 = ", ethers.formatEther(wei), "ETH")
# Expected: 0.0402 ETH
```

---

## Key Features Summary

✅ **Approval Steps**:
- Require wallet connection
- Optional note/comment field
- Signature recorded on-chain
- Blockchain confirmation required

✅ **Payment Steps**:
- USD to ETH conversion (1 ETH = $2,500)
- Real-time conversion display
- Automatic ETH calculation
- Overpayment refunds
- Transaction confirmation required

✅ **User Experience**:
- Clear step type indicators
- Helpful alerts for each type
- Loading states during execution
- Confirmation waiting messages
- Completion notifications

---

## Next Steps

1. ✅ Test all step types individually
2. ✅ Test mixed process workflows
3. ✅ Verify contract events on-chain
4. 🔄 Consider adding:
   - Digital signature verification
   - Payment receipts/history
   - Step authorization roles
   - Conditional branching based on step results
