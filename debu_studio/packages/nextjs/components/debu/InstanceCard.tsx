"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

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

export const InstanceCard = ({ address, isFullView = true }: { address: string; isFullView?: boolean }) => {
  const [stepData, setStepData] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastConfirmedStepIndex, setLastConfirmedStepIndex] = useState<bigint | null>(null);

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

  const handleExecute = async () => {
    try {
      // Store the current step index before executing
      setLastConfirmedStepIndex(currentStepIndex || null);
      setIsExecuting(true);
      await writeContractAsync({
        address: address as `0x${string}`,
        abi: PROCESS_INSTANCE_ABI,
        functionName: "executeStep",
        args: [stepData],
      });
      setStepData("");
      // Wait a moment before refetching to allow blockchain to confirm
      setTimeout(() => {
        refetchStepIndex();
        setIsExecuting(false);
      }, 2000);
    } catch (e) {
      console.error("Error executing step:", e);
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
          
          <div className="form-control mb-4">
            <label className="label py-1">
              <span className="label-text font-semibold text-slate-700 dark:text-slate-300">Action Input ({currentStep.actionType})</span>
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
          
          <div className="flex gap-2">
            <button 
              className="btn btn-primary flex-1"
              onClick={handleExecute}
              disabled={isPending || !stepData || isExecuting}
            >
              {isPending || isExecuting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {isExecuting ? "Waiting for confirmation..." : "Executing..."}
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
