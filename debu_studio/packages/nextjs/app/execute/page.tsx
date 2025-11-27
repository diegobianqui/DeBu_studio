"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { NextPage } from "next";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";
import { InstanceCard } from "~~/components/debu/InstanceCard";

const PROCESS_TEMPLATE_ABI = [
  {
    inputs: [],
    name: "instantiate",
    outputs: [{ internalType: "address", name: "instance", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const ExecuteContent = () => {
  const { address } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const instanceParam = searchParams.get("instance");
  const [processAddress, setProcessAddress] = useState("");
  const [instanceAddress, setInstanceAddress] = useState("");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  
  const { writeContractAsync, isPending: isCreatingInstance } = useWriteContract();
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  });

  const handleCreateFromProcess = async () => {
    if (!processAddress.trim()) {
      setError("Please enter a process address");
      return;
    }
    
    setError("");
    
    try {
      // Call instantiate() on the process template to create a new instance
      const hash = await writeContractAsync({
        address: processAddress as `0x${string}`,
        abi: PROCESS_TEMPLATE_ABI,
        functionName: "instantiate",
      });
      setTxHash(hash);
      notification.success("Creating process instance...");
    } catch (err) {
      console.error("Error creating instance:", err);
      setError("Failed to create instance. Please check the address and try again.");
    }
  };

  const handleLoadInstance = async () => {
    if (!instanceAddress.trim()) {
      setError("Please enter an instance address");
      return;
    }
    
    setError("");
    
    try {
      // Load the specific instance
      router.push(`/execute?instance=${instanceAddress}`);
      setInstanceAddress("");
    } catch (err) {
      setError("Failed to load instance");
    }
  };

  // When transaction completes, extract instance address from logs
  React.useEffect(() => {
    if (receipt && receipt.logs && receipt.logs.length > 0) {
      try {
        // The InstanceCreated event is emitted with the instance address
        // The second topic (index 1) contains the instance address (32 bytes, padded)
        if (receipt.logs[0] && receipt.logs[0].topics && receipt.logs[0].topics[1]) {
          const instanceAddress = `0x${receipt.logs[0].topics[1].slice(-40)}`;
          console.log("Created instance:", instanceAddress);
          setProcessAddress("");
          setTxHash(null);
          setTimeout(() => {
            router.push(`/execute?instance=${instanceAddress}`);
          }, 500);
        }
      } catch (err) {
        console.error("Error parsing instance address from receipt:", err);
        setError("Instance created but could not navigate. Please try loading the instance manually.");
      }
    }
  }, [receipt, router]);

  if (!address) {
    return (
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-4xl text-center">
          <p className="text-lg text-base-content/60">
            Please connect your wallet to execute processes.
          </p>
        </div>
      </div>
    );
  }

  if (!instanceParam) {
    return (
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-4xl">
          <h1 className="text-center mb-8 text-base-content">
            <span className="block text-4xl font-bold">Execute Process</span>
          </h1>
          
          {error && (
            <div className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Instance from Process */}
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Create New Instance</h2>
                <p className="text-sm text-base-content/60 mb-4">Enter a process blueprint address to create a new instance:</p>
                
                <div className="form-control w-full mb-4">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-sm">Process Address</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="input input-bordered input-sm w-full focus:input-primary rounded-lg"
                    value={processAddress}
                    onChange={(e) => {
                      setProcessAddress(e.target.value);
                      setError("");
                    }}
                  />
                </div>

                <button
                  onClick={handleCreateFromProcess}
                  disabled={isCreatingInstance || !processAddress.trim()}
                  className="btn btn-primary btn-sm w-full"
                >
                  {isCreatingInstance ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Instance
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Load Existing Instance */}
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Load Instance</h2>
                <p className="text-sm text-base-content/60 mb-4">Enter an instance address to load it for execution:</p>
                
                <div className="form-control w-full mb-4">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-sm">Instance Address</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="input input-bordered input-sm w-full focus:input-primary rounded-lg"
                    value={instanceAddress}
                    onChange={(e) => {
                      setInstanceAddress(e.target.value);
                      setError("");
                    }}
                  />
                </div>

                <button
                  onClick={handleLoadInstance}
                  disabled={!instanceAddress.trim()}
                  className="btn btn-primary btn-sm w-full"
                >
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Load Instance
                  </>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-base-content/60 mb-2">or</p>
          <a 
            href="/browse" 
            className="link link-primary text-sm"
          >
            Browse existing instances →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8 text-base-content">
          <span className="block text-4xl font-bold">Execute Process</span>
          <span className="block text-sm text-base-content/60 mt-2 font-mono">
            {instanceParam.slice(0, 6)}...{instanceParam.slice(-4)}
          </span>
        </h1>

        <div className="card">
          <div className="card-body">
            <InstanceCard address={instanceParam} />
          </div>
        </div>

        <div className="text-center mt-6">
          <a 
            href="/browse" 
            className="link link-primary text-sm"
          >
            ← Back to Browse
          </a>
        </div>
      </div>
    </div>
  );
};

const Execute: NextPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-4xl text-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    }>
      <ExecuteContent />
    </Suspense>
  );
};

export default Execute;
