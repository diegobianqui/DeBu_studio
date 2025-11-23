"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { parseEther } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";

// Minimal ABI for ProcessInstance
const PROCESS_INSTANCE_ABI = [
  {
    "inputs": [],
    "name": "template",
    "outputs": [{"internalType": "contract IProcessTemplate", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentStepIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isCompleted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_data", "type": "string"}],
    "name": "executeStep",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_data", "type": "string"}],
    "name": "executeStepWithPayment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

// Minimal ABI for ProcessTemplate to get name
const PROCESS_TEMPLATE_ABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStepCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "getStep",
    "outputs": [
        {
            "components": [
                {"internalType": "string", "name": "name", "type": "string"},
                {"internalType": "string", "name": "description", "type": "string"},
                {"internalType": "string", "name": "actionType", "type": "string"},
                {"internalType": "string", "name": "config", "type": "string"}
            ],
            "internalType": "struct ProcessTemplate.Step",
            "name": "",
            "type": "tuple"
        }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// StepHandlers ABI
const STEP_HANDLERS_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "amountUsd", "type": "uint256"}],
    "name": "convertUsdToWei",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "processInstance", "type": "address"}, {"internalType": "string", "name": "approvalHash", "type": "string"}],
    "name": "signApproval",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "processInstance", "type": "address"}, {"internalType": "uint256", "name": "amountUsd", "type": "uint256"}],
    "name": "processPayment",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

export const InstanceCard = ({ address, isFullView = true }: { address: string; isFullView?: boolean }) => {
  const [stepData, setStepData] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastConfirmedStepIndex, setLastConfirmedStepIndex] = useState<bigint | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [approvalData, setApprovalData] = useState("");
  const [estimatedWei, setEstimatedWei] = useState<string>("0");
  const { address: userAddress } = useAccount();
  
  // Get StepHandlers contract address from deployed contracts
  const STEP_HANDLERS_ADDRESS = (deployedContracts[31337]?.StepHandlers?.address || "0x0000000000000000000000000000000000000000") as `0x${string}`;

  // 1. Get the Template Address
  const { data: templateAddress } = useReadContract({
    address: address as `0x${string}`,
    abi: PROCESS_INSTANCE_ABI,
    functionName: "template",
  });

  // 2. Get the Template Name
  const { data: processName } = useReadContract({
    address: templateAddress as `0x${string}`,
    abi: PROCESS_TEMPLATE_ABI,
    functionName: "name",
    query: {
        enabled: !!templateAddress,
    }
  });

  // 3. Get Current Step Index
  const { data: currentStepIndex, refetch: refetchStepIndex } = useReadContract({
    address: address as `0x${string}`,
    abi: PROCESS_INSTANCE_ABI,
    functionName: "currentStepIndex",
    query: {
        enabled: !isExecuting, // Don't auto-refetch while executing
    }
  });

  // 3.5 Get Step Count
  const { data: stepCount } = useReadContract({
    address: templateAddress as `0x${string}`,
    abi: PROCESS_TEMPLATE_ABI,
    functionName: "getStepCount",
    query: {
        enabled: !!templateAddress,
    }
  });

  // 4. Get Current Step Details
  const { data: currentStep } = useReadContract({
    address: templateAddress as `0x${string}`,
    abi: PROCESS_TEMPLATE_ABI,
    functionName: "getStep",
    args: [currentStepIndex || 0n],
    query: {
        enabled: !!templateAddress && currentStepIndex !== undefined && stepCount !== undefined && currentStepIndex < stepCount && !isExecuting,
    }
  });

  // 5. Check if Completed
  const { data: isCompleted } = useReadContract({
    address: address as `0x${string}`,
    abi: PROCESS_INSTANCE_ABI,
    functionName: "isCompleted",
    query: {
        enabled: !isExecuting, // Don't auto-refetch while executing
    }
  });

  const { writeContractAsync, isPending } = useWriteContract();
  
  // Hook to convert USD to Wei
  const { data: convertedWei } = useReadContract({
    address: STEP_HANDLERS_ADDRESS,
    abi: STEP_HANDLERS_ABI,
    functionName: "convertUsdToWei",
    args: [BigInt(paymentAmount ? parseInt(paymentAmount) * 100 : 0)], // Convert to cents
    query: {
        enabled: !!paymentAmount && currentStep?.actionType === "payment",
    }
  });

  // Update estimated Wei when converted
  useEffect(() => {
    if (convertedWei !== undefined) {
      setEstimatedWei(convertedWei.toString());
    }
  }, [convertedWei]);

  const handleExecute = async () => {
    try {
      // Store the current step index before executing
      setLastConfirmedStepIndex(currentStepIndex || null);
      setIsExecuting(true);

      // Different execution based on step type
      if (currentStep?.actionType === "approval") {
        // For approval: call executeStep with approval data
        await writeContractAsync({
          address: address as `0x${string}`,
          abi: PROCESS_INSTANCE_ABI,
          functionName: "executeStep",
          args: [approvalData || "approved"],
        });
        setApprovalData("");
      } else if (currentStep?.actionType === "payment") {
        // For payment: call with eth value
        const weiAmount = BigInt(estimatedWei);
        const txData = {
          address: address as `0x${string}`,
          abi: PROCESS_INSTANCE_ABI,
          functionName: "executeStep",
          args: [paymentAmount],
          value: weiAmount,
        } as any;
        await writeContractAsync(txData);
        setPaymentAmount("");
        setEstimatedWei("0");
      } else {
        // For form/default: use stepData
        await writeContractAsync({
          address: address as `0x${string}`,
          abi: PROCESS_INSTANCE_ABI,
          functionName: "executeStep",
          args: [stepData],
        });
        setStepData("");
      }

      notification.success("Step completed! Waiting for confirmation...");

      // Wait a moment before refetching to allow blockchain to confirm
      setTimeout(() => {
        refetchStepIndex();
        setIsExecuting(false);
      }, 2000);
    } catch (e) {
      console.error("Error executing step:", e);
      notification.error("Failed to execute step");
      setIsExecuting(false);
    }
  };

  if (!isFullView) {
    // Compact view for list display
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {processName as string || "Loading..."}
          </p>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
            {address}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className={`badge badge-sm font-semibold ${isCompleted ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-200" : "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200"}`}>
            {isCompleted ? "Completed" : `Step ${(Number(currentStepIndex) || 0) + 1}`}
          </span>
        </div>
      </div>
    );
  }

  // Full view for execution
  return (
    <div className="w-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{processName as string || "Loading..."}</h2>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 break-all">
            {address}
          </div>
        </div>
        <div className={`badge badge-lg font-semibold ${isCompleted ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-200" : "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200"}`}>
          {isCompleted ? "Completed" : isExecuting ? "⏳ Waiting for confirmation..." : `Step ${(Number(lastConfirmedStepIndex ?? currentStepIndex) || 0) + 1}/${Number(stepCount) || 0}`}
        </div>
      </div>

      <div className="divider"></div>

      {!isCompleted && currentStep && (
        <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">{currentStep.name}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{currentStep.description}</p>
          
          {/* Form/Text Input */}
          {currentStep.actionType === "form" && (
            <div className="form-control mb-4">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-700 dark:text-slate-300">Form Input</span>
              </label>
              <textarea 
                className="textarea textarea-bordered focus:textarea-primary bg-white dark:bg-slate-700 dark:text-slate-100"
                placeholder="Enter data or paste IPFS hash..."
                rows={4}
                value={stepData}
                onChange={(e) => setStepData(e.target.value)}
                disabled={isExecuting}
              />
            </div>
          )}

          {/* Approval Step */}
          {currentStep.actionType === "approval" && (
            <div className="space-y-4 mb-4">
              <div className="alert alert-info shadow-md bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-semibold">Wallet Signature Required</p>
                  <p className="opacity-75 text-xs mt-1">You will be asked to sign with your connected wallet to approve this step.</p>
                </div>
              </div>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-slate-700 dark:text-slate-300">Optional Note (IPFS hash or comment)</span>
                </label>
                <textarea 
                  className="textarea textarea-bordered focus:textarea-primary bg-white dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Add any notes for this approval..."
                  rows={3}
                  value={approvalData}
                  onChange={(e) => setApprovalData(e.target.value)}
                  disabled={isExecuting}
                />
              </div>
            </div>
          )}

          {/* Payment Step */}
          {currentStep.actionType === "payment" && (
            <div className="space-y-4 mb-4">
              <div className="alert alert-warning shadow-md bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <p className="font-semibold">Payment Required (1 ETH = $2,500 USD)</p>
                  <p className="opacity-75 text-xs mt-1">Enter the amount in USD and send the equivalent ETH</p>
                </div>
              </div>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-slate-700 dark:text-slate-300">Amount (USD)</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    className="input input-bordered focus:input-primary bg-white dark:bg-slate-700 dark:text-slate-100 flex-1"
                    placeholder="e.g., 100.50"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    disabled={isExecuting}
                    step="0.01"
                  />
                  <span className="badge badge-lg badge-outline font-mono">
                    $
                  </span>
                </div>
              </div>
              
              {paymentAmount && (
                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">${paymentAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exchange Rate:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">1 ETH = $2,500</span>
                    </div>
                    <div className="divider my-1"></div>
                    <div className="flex justify-between">
                      <span className="font-semibold">ETH to Send:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {estimatedWei !== "0" ? (parseFloat(estimatedWei) / 1e18).toFixed(6) : "0"} ETH
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <button 
              className="btn btn-primary flex-1"
              onClick={handleExecute}
              disabled={
                isPending || isExecuting || 
                (currentStep.actionType === "form" && !stepData) ||
                (currentStep.actionType === "payment" && !paymentAmount)
              }
            >
              {isPending || isExecuting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {isExecuting ? "Waiting for confirmation..." : "Executing..."}
                </>
              ) : currentStep.actionType === "approval" ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sign & Approve
                </>
              ) : currentStep.actionType === "payment" ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Send Payment
                </>
              ) : (
                "Complete Step"
              )}
            </button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="alert alert-success shadow-lg mt-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">Process successfully completed! 🎉</span>
        </div>
      )}
    </div>
  );
}
