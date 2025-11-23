"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useSignMessage, useAccount } from "wagmi";
import { parseEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

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

export const InstanceCard = ({ address }: { address: string }) => {
  const [stepData, setStepData] = useState("");
  const [signatureData, setSignatureData] = useState<{ signature: `0x${string}`, hash: string } | null>(null);
  const [isSigningApproval, setIsSigningApproval] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("0.00001");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  const { address: walletAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Constants
  const REQUIRED_PAYMENT_ETH = "0.00001";

  // Validate address format
  const validAddress = address?.startsWith("0x") ? (address as `0x${string}`) : (`0x${address}` as `0x${string}`);

  // 1. Get the Template Address
  const { data: templateAddress, isLoading: loadingTemplate } = useReadContract({
    address: validAddress,
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
  const { data: currentStepIndex, refetch: refetchStepIndex, isLoading: loadingStep } = useReadContract({
    address: validAddress,
    abi: PROCESS_INSTANCE_ABI,
    functionName: "currentStepIndex",
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
        enabled: !!templateAddress && currentStepIndex !== undefined && stepCount !== undefined && currentStepIndex < stepCount,
    }
  });

  // 5. Check if Completed
  const { data: isCompleted, refetch: refetchIsCompleted } = useReadContract({
    address: validAddress,
    abi: PROCESS_INSTANCE_ABI,
    functionName: "isCompleted",
  });

  const { writeContractAsync, isPending } = useWriteContract();

  const handleApprovalSignature = async () => {
    if (!currentStep || currentStep.actionType !== "approval" || !walletAddress) {
      notification.error("Signature required for approval step");
      return;
    }

    try {
      setIsSigningApproval(true);
      const message = `Approve: ${currentStep.name} - ${walletAddress}`;
      const hash = require('crypto').createHash('sha256').update(message).digest('hex');
      
      const signature = await signMessageAsync({
        message: message,
      });

      setSignatureData({
        signature: signature as `0x${string}`,
        hash: `0x${hash}`,
      });
      
      notification.success("Approval signature confirmed!");
    } catch (e) {
      console.error("Error signing approval:", e);
      notification.error("Failed to sign approval");
    } finally {
      setIsSigningApproval(false);
    }
  };

  const handleExecute = async () => {
    try {
      // For approval steps, require signature first
      if (currentStep && currentStep.actionType === "approval") {
        if (!signatureData) {
          notification.error("Please sign the approval first");
          return;
        }
        // Include signature in the step data
        const dataWithSignature = JSON.stringify({
          notes: stepData,
          signature: signatureData.signature,
          signedBy: walletAddress,
        });
        
        await writeContractAsync({
          address: validAddress,
          abi: PROCESS_INSTANCE_ABI,
          functionName: "executeStep",
          args: [dataWithSignature],
        });
        
        setSignatureData(null);
      } 
      // For payment steps, require payment confirmation
      else if (currentStep && currentStep.actionType === "payment") {
        if (!paymentConfirmed) {
          notification.error("Please confirm the payment first");
          return;
        }
        
        // Include payment info in the step data
        const dataWithPayment = JSON.stringify({
          amount: paymentAmount,
          notes: stepData,
          paidBy: walletAddress,
        });
        
        await writeContractAsync({
          address: validAddress,
          abi: PROCESS_INSTANCE_ABI,
          functionName: "executeStepWithPayment",
          args: [dataWithPayment],
          value: parseEther(REQUIRED_PAYMENT_ETH),
        });
        
        setPaymentConfirmed(false);
        setPaymentAmount(REQUIRED_PAYMENT_ETH);
      } 
      else {
        // For other steps, execute normally
        await writeContractAsync({
          address: validAddress,
          abi: PROCESS_INSTANCE_ABI,
          functionName: "executeStep",
          args: [stepData],
        });
      }
      
      setStepData("");
      refetchStepIndex();
      refetchIsCompleted();
      notification.success("Step completed successfully!");
    } catch (e) {
      console.error("Error executing step:", e);
      notification.error("Failed to execute step");
    }
  };

  return (
    <div className="card w-full bg-base-100 shadow-xl mb-4">
      <div className="card-body">
        {loadingTemplate && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg text-blue-600"></span>
          </div>
        )}

        {!loadingTemplate && (
          <>
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="card-title">{processName as string || "Loading..."}</h2>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                        Instance: <Address address={validAddress} />
                    </div>
                </div>
                <div className="badge badge-primary">
                    {isCompleted ? "✅ Completed" : `📋 Step ${(Number(currentStepIndex) || 0) + 1} / ${stepCount ? Number(stepCount) : '?'}`}
                </div>
            </div>

            {/* Step Visualization as Arrows */}
            {stepCount && Number(stepCount) > 0 && (
                <div className="w-full overflow-x-auto pb-4 my-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-lg p-3 min-h-[100px] shadow-inner">
                    <div className="flex items-center min-w-full px-2 gap-0">
                        {Array.from({ length: Number(stepCount) }).map((_, index) => {
                            const isFirst = index === 0;
                            const isCurrent = index === Number(currentStepIndex);
                            const isCompleted = index < Number(currentStepIndex);
                            
                            // Arrow shape logic
                            let clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)";
                            if (isFirst) {
                                clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)";
                            }

                            // Determine colors based on state
                            let bgGradient = "from-slate-300 via-slate-400 to-slate-500"; // Not started
                            if (isCompleted) {
                                bgGradient = "from-green-400 via-green-500 to-green-600"; // Completed
                            } else if (isCurrent) {
                                bgGradient = "from-blue-500 via-blue-600 to-blue-700"; // Current
                            }

                            return (
                                <div
                                    key={index}
                                    className={`relative flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${bgGradient} text-white w-40 h-16 transition-all hover:shadow-lg hover:scale-105 shadow-md`}
                                    style={{
                                        clipPath: clipPath,
                                        marginLeft: isFirst ? 0 : "-18px",
                                    }}
                                >
                                    <div className="flex flex-col items-center text-center px-4">
                                        <div className={`badge badge-xs ${isCurrent ? "bg-white/30" : "bg-white/20"} border-none mb-0.5`}>
                                            Step {index + 1}
                                        </div>
                                        <span className="font-bold text-xs line-clamp-1">
                                            {isCompleted ? "✓" : isCurrent ? "→" : "—"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!isCompleted && currentStep && (
                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <h3 className="font-bold text-lg">{currentStep.name}</h3>
                    <p className="text-sm mb-4">{currentStep.description}</p>
                    
                    {/* Approval Step - Signature Required */}
                    {currentStep.actionType === "approval" && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-sm text-blue-900 dark:text-blue-300">Wallet Signature Required</span>
                            </div>
                            <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">
                                This approval requires a signature from your wallet to prove authorization.
                            </p>
                            
                            {signatureData ? (
                                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded p-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs text-green-800 dark:text-green-200 font-semibold">✓ Approval signed</span>
                                </div>
                            ) : (
                                <button
                                    className="btn btn-sm btn-outline btn-primary w-full"
                                    onClick={handleApprovalSignature}
                                    disabled={isSigningApproval}
                                >
                                    {isSigningApproval ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Signing...
                                        </>
                                    ) : (
                                        "🔐 Sign Approval with Wallet"
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Payment Step - ETH Required */}
                    {currentStep.actionType === "payment" && (
                        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8.16 2.3a1 1 0 01.68 0l1.5.5a1 1 0 01.61.58l.5 1.5a1 1 0 01-.01.58l-.5 1.5a1 1 0 01-.58.61l-1.5.5a1 1 0 01-.58 0l-1.5-.5a1 1 0 01-.61-.58l-.5-1.5a1 1 0 01.01-.58l.5-1.5a1 1 0 01.58-.61l1.5-.5zM2.3 8.16a1 1 0 011.34-.68l1.5.5a1 1 0 01.61.58l.5 1.5a1 1 0 01-.01.58l-.5 1.5a1 1 0 01-.58.61l-1.5.5a1 1 0 01-.58 0l-1.5-.5a1 1 0 01-.61-.58l-.5-1.5a1 1 0 01.01-.58l.5-1.5a1 1 0 01.58-.61l1.5-.5zM14.84 2.3a1 1 0 01.68 0l1.5.5a1 1 0 01.61.58l.5 1.5a1 1 0 01-.01.58l-.5 1.5a1 1 0 01-.58.61l-1.5.5a1 1 0 01-.58 0l-1.5-.5a1 1 0 01-.61-.58l-.5-1.5a1 1 0 01.01-.58l.5-1.5a1 1 0 01.58-.61l1.5-.5zM2.3 14.84a1 1 0 011.34-.68l1.5.5a1 1 0 01.61.58l.5 1.5a1 1 0 01-.01.58l-.5 1.5a1 1 0 01-.58.61l-1.5.5a1 1 0 01-.58 0l-1.5-.5a1 1 0 01-.61-.58l-.5-1.5a1 1 0 01.01-.58l.5-1.5a1 1 0 01.58-.61l1.5-.5z" />
                                </svg>
                                <span className="font-semibold text-sm text-amber-900 dark:text-amber-300">Payment Required</span>
                            </div>
                            <p className="text-xs text-amber-800 dark:text-amber-200 mb-3">
                                This step requires a payment of <span className="font-bold">{REQUIRED_PAYMENT_ETH} ETH</span> to proceed.
                            </p>
                            
                            {paymentConfirmed ? (
                                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded p-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs text-green-800 dark:text-green-200 font-semibold">✓ Payment confirmed</span>
                                </div>
                            ) : (
                                <button
                                    className="btn btn-sm btn-outline btn-warning w-full"
                                    onClick={() => setPaymentConfirmed(true)}
                                >
                                    💰 Confirm Payment ({REQUIRED_PAYMENT_ETH} ETH)
                                </button>
                            )}
                        </div>
                    )}

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">
                                {currentStep.actionType === "approval" ? "Approval Notes (Optional)" : currentStep.actionType === "payment" ? "Payment Notes (Optional)" : "Action Input"}
                            </span>
                        </label>
                        <input 
                            type="text" 
                            className="input input-bordered" 
                            placeholder={currentStep.actionType === "approval" ? "Add notes for this approval..." : currentStep.actionType === "payment" ? "Add notes for this payment..." : "Enter data..."}
                            value={stepData}
                            onChange={(e) => setStepData(e.target.value)}
                        />
                    </div>
                    
                    <div className="card-actions justify-end mt-4">
                        <button 
                            className="btn btn-success btn-sm"
                            onClick={handleExecute}
                            disabled={isPending || !stepData || (currentStep.actionType === "approval" && !signatureData) || (currentStep.actionType === "payment" && !paymentConfirmed)}
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
          </>
        )}
      </div>
    </div>
  );
};
