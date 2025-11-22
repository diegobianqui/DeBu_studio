"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount, useReadContract } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { InstanceCard } from "~~/components/debu/InstanceCard";

// We need to read the userInstances from ALL templates.
// This is tricky because the userInstances mapping is on the Template contract, not the Deployer.
// And we don't know which templates the user has interacted with easily without an indexer.
//
// WAIT! In my previous edit to ProcessTemplate.sol, I added `mapping(address => address[]) public userInstances;`
// This stores instances created by the user *for that specific template*.
//
// To show "My Processes" across ALL templates, we would need:
// 1. A central registry of all instances for a user (best)
// 2. Or iterate all templates and check for instances (slow)
//
// For this MVP, let's assume the user remembers which template they used, OR we can iterate the deployed templates.
// Since we have `DeBuDeployer.getDeployedProcessesCount()`, we can iterate all templates.
//
// Let's build a component that iterates all templates and collects instances.

const Execute: NextPage = () => {
  const { address } = useAccount();
  const [allInstances, setAllInstances] = useState<string[]>([]);

  const { data: deployedProcessesCount } = useScaffoldReadContract({
    contractName: "DeBuDeployer",
    functionName: "getDeployedProcessesCount",
  });

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Execute Processes</span>
          <span className="block text-2xl mb-2">Manage your running instances</span>
        </h1>

        <div className="space-y-6">
            {deployedProcessesCount && Array.from({ length: Number(deployedProcessesCount) }).map((_, i) => (
                <TemplateInstancesFetcher key={i} index={i} userAddress={address} />
            ))}
            
            {!address && (
                <div className="text-center">Please connect your wallet to view your processes.</div>
            )}
        </div>
      </div>
    </div>
  );
};

const TemplateInstancesFetcher = ({ index, userAddress }: { index: number, userAddress?: string }) => {
    // 1. Get Template Address
    const { data: templateAddress } = useScaffoldReadContract({
        contractName: "DeBuDeployer",
        functionName: "getDeployedProcess",
        args: [BigInt(index)],
    });

    // 2. Get Instances for User from that Template
    // We need a custom ABI read here because `getUserInstances` is on the Template, not Deployer
    const { data: userInstances } = useReadContract({
        address: templateAddress,
        abi: [
            {
                "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
                "name": "getUserInstances",
                "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
                "stateMutability": "view",
                "type": "function"
            }
        ],
        functionName: "getUserInstances",
        args: [userAddress as `0x${string}`],
        query: {
            enabled: !!templateAddress && !!userAddress,
        }
    });

    if (!userInstances || userInstances.length === 0) return null;

    return (
        <div className="collapse collapse-arrow bg-base-200">
            <input type="checkbox" defaultChecked /> 
            <div className="collapse-title text-xl font-medium">
                Template: <AddressDisplay address={templateAddress} />
            </div>
            <div className="collapse-content"> 
                {userInstances.map((instanceAddr: any) => (
                    <InstanceCard key={instanceAddr} address={instanceAddr} />
                ))}
            </div>
        </div>
    );
};

// Helper to show address or name if we fetched it
const AddressDisplay = ({ address }: { address?: string }) => {
    if (!address) return <span>...</span>;
    return <span className="font-mono text-sm">{address}</span>;
}

export default Execute;
