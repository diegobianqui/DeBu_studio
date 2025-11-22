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

export const InstanceCard = ({ address }: { address: string }) => {
  const [stepData, setStepData] = useState("");

  // 1. Get the Template Address
  const { data: templateAddress } = useReadContract({
    address: address,
    abi: PROCESS_INSTANCE_ABI,
    functionName: "template",
  });

  // 2. Get the Template Name
  const { data: processName } = useReadContract({
    address: templateAddress,
    abi: PROCESS_TEMPLATE_ABI,
    functionName: "name",
    query: {
        enabled: !!templateAddress,
    }
  });

  // 3. Get Current Step Index
  const { data: currentStepIndex, refetch: refetchStepIndex } = useReadContract({
    address: address,
    abi: PROCESS_INSTANCE_ABI,
    functionName: "currentStepIndex",
  });

  // 4. Get Current Step Details
  const { data: currentStep } = useReadContract({
    address: templateAddress,
    abi: PROCESS_TEMPLATE_ABI,
    functionName: "getStep",
    args: [currentStepIndex || 0n],
    query: {
        enabled: !!templateAddress && currentStepIndex !== undefined,
    }
  });

  // 5. Check if Completed
  const { data: isCompleted } = useReadContract({
    address: address,
    abi: PROCESS_INSTANCE_ABI,
    functionName: "isCompleted",
  });

  const { writeContractAsync, isPending } = useWriteContract();

  const handleExecute = async () => {
    try {
      await writeContractAsync({
        address: address,
        abi: PROCESS_INSTANCE_ABI,
        functionName: "executeStep",
        args: [stepData],
      });
      setStepData("");
      refetchStepIndex();
    } catch (e) {
      console.error("Error executing step:", e);
    }
  };

  return (
    <div className="card w-full bg-base-100 shadow-xl mb-4">
      <div className="card-body">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="card-title">{processName as string || "Loading..."}</h2>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    Instance: <Address address={address} />
                </div>
            </div>
            <div className="badge badge-primary">
                {isCompleted ? "Completed" : `Step ${(Number(currentStepIndex) || 0) + 1}`}
            </div>
        </div>

        {!isCompleted && currentStep && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
                <h3 className="font-bold text-lg">{currentStep.name}</h3>
                <p className="text-sm mb-4">{currentStep.description}</p>
                
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Action Input ({currentStep.actionType})</span>
                    </label>
                    <input 
                        type="text" 
                        className="input input-bordered" 
                        placeholder="Enter data..."
                        value={stepData}
                        onChange={(e) => setStepData(e.target.value)}
                    />
                </div>
                
                <div className="card-actions justify-end mt-4">
                    <button 
                        className="btn btn-success btn-sm"
                        onClick={handleExecute}
                        disabled={isPending || !stepData}
                    >
                        {isPending ? "Executing..." : "Complete Step"}
                    </button>
                </div>
            </div>
        )}

        {isCompleted && (
            <div className="alert alert-success mt-4">
                <span>Process successfully completed! 🎉</span>
            </div>
        )}
      </div>
    </div>
  );
};
