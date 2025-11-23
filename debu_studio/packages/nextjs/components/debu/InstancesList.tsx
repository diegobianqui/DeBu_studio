"use client";

import React from "react";
import { useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

const PROCESS_TEMPLATE_ABI = [
	{
		inputs: [{ internalType: "address", name: "user", type: "address" }],
		name: "getUserInstances",
		outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

const PROCESS_INSTANCE_ABI = [
	{
		inputs: [],
		name: "currentStepIndex",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "isCompleted",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

interface InstancesListProps {
	templateAddress: string;
}

export const InstancesList = ({ templateAddress }: InstancesListProps) => {
	const router = useRouter();
	const { address: userAddress } = useAccount();

	const { data: userInstances, isLoading, error, refetch } = useReadContract({
		address: templateAddress as `0x${string}`,
		abi: PROCESS_TEMPLATE_ABI,
		functionName: "getUserInstances",
		args: [userAddress as `0x${string}`],
		query: {
			enabled: !!templateAddress && !!userAddress,
			staleTime: 0, // Don't cache
			gcTime: 0, // Don't garbage collect
		},
	});

	const handleInstanceClick = (instanceAddress: string) => {
		router.push(`/execute?instance=${instanceAddress}`);
	};

	const instances = userInstances || [];

	// Debug logging
	if (instances.length > 0) {
		console.log(`Found ${instances.length} instances for template ${templateAddress}`);
	}

	if (isLoading) {
		return (
			<div className="text-center py-6 text-slate-500 dark:text-slate-400">
				<span className="loading loading-spinner loading-sm"></span>
				<p className="text-sm mt-2">Loading instances...</p>
			</div>
		);
	}

	if (instances.length === 0) {
		return (
			<div className="text-center py-6 text-slate-500 dark:text-slate-400">
				<p className="text-sm">No instances created yet</p>
				<p className="text-xs mt-1">Click "Start" to create the first instance of this process</p>
			</div>
		);
	}

	return (
		<div className="space-y-3 p-4">
			<div className="flex items-center justify-between mb-3">
				<h3 className="font-semibold text-slate-700 dark:text-slate-300">
					Your Instances: <span className="text-sm font-normal text-slate-500">({instances.length} total)</span>
				</h3>
				<button
					onClick={() => refetch()}
					className="btn btn-xs btn-ghost"
					title="Refresh instances"
				>
					🔄
				</button>
			</div>
			{instances.map((instanceAddr: string) => (
				<InstanceCard
					key={instanceAddr}
					instanceAddress={instanceAddr}
					onNavigate={handleInstanceClick}
				/>
			))}
		</div>
	);
};

const InstanceCard = ({
	instanceAddress,
	onNavigate,
}: {
	instanceAddress: string;
	onNavigate: (address: string) => void;
}) => {
	const { data: currentStep } = useReadContract({
		address: instanceAddress as `0x${string}`,
		abi: PROCESS_INSTANCE_ABI,
		functionName: "currentStepIndex",
	});

	const { data: isCompleted } = useReadContract({
		address: instanceAddress as `0x${string}`,
		abi: PROCESS_INSTANCE_ABI,
		functionName: "isCompleted",
	});

	const shortAddress = `${instanceAddress.slice(0, 6)}...${instanceAddress.slice(-4)}`;
	const status = isCompleted ? "✅ Completed" : `📋 Step ${Number(currentStep || 0) + 1}`;

	return (
		<button
			onClick={() => onNavigate(instanceAddress)}
			className="w-full group flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all text-left"
		>
			<div className="flex flex-col gap-1">
				<span className="font-mono text-xs text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
					{shortAddress}
				</span>
				<span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
					{status}
				</span>
			</div>
			<span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
				→
			</span>
		</button>
	);
};
