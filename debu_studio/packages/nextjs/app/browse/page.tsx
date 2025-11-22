"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { ProcessCard } from "~~/components/debu/ProcessCard";

const Browse: NextPage = () => {
  const [processAddresses, setProcessAddresses] = useState<string[]>([]);

  const { data: deployedProcessesCount } = useScaffoldReadContract({
    contractName: "DeBuDeployer",
    functionName: "getDeployedProcessesCount",
  });

  // This is a bit inefficient (N+1 queries), but fine for a prototype.
  // We need to fetch each address by index.
  // A better way would be to have a function that returns an array of addresses in the contract.
  // For now, let's assume we can just fetch them one by one or the contract has a "getDeployedProcesses" that returns all.
  // Wait, I didn't add "getDeployedProcesses" that returns the array, only "getDeployedProcess(index)".
  // Let's use a loop to fetch them if count is small, or just fetch the last 10.
  
  // Actually, I can just read the public array `deployedProcesses` if it was public?
  // Yes, `address[] public deployedProcesses;` generates a getter `deployedProcesses(uint256)`.
  // So I can iterate.
  
  // Let's create a component that fetches the address for an index, then renders the card.
  
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Browse Processes</span>
          <span className="block text-2xl mb-2">Start a new process instance</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deployedProcessesCount && Array.from({ length: Number(deployedProcessesCount) }).map((_, i) => (
                <ProcessAddressFetcher key={i} index={i} />
            ))}
            
            {!deployedProcessesCount && (
                <div className="text-center col-span-full">Loading processes...</div>
            )}
            
            {deployedProcessesCount === 0n && (
                <div className="text-center col-span-full">No processes deployed yet. Go to Studio to create one!</div>
            )}
        </div>
      </div>
    </div>
  );
};

const ProcessAddressFetcher = ({ index }: { index: number }) => {
    const { data: address } = useScaffoldReadContract({
        contractName: "DeBuDeployer",
        functionName: "getDeployedProcess",
        args: [BigInt(index)],
    });

    if (!address) return <div className="skeleton w-96 h-48"></div>;

    return <ProcessCard address={address} />;
};

export default Browse;
