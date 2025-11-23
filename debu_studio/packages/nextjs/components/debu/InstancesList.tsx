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

	const { data: userInstances } = useReadContract({
		address: templateAddress as `0x${string}`,
		abi: PROCESS_TEMPLATE_ABI,
		functionName: "getUserInstances",
		args: [userAddress || ("0x0000000000000000000000000000000000000000" as `0x${string}`)],
		query: {
			enabled: !!userAddress,
		},
	});

	const handleInstanceClick = (instanceAddress: string) => {
		router.push(`/execute?instance=${instanceAddress}`);
	};

	const instances = userInstances || [];

	return (
		<div className="p-4">
			<h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Your Active Instances ({instances.length})
			</h3>

			{instances.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{instances.map((instanceAddress: string, idx: number) => (
						<InstanceCard
							key={idx}
							instanceAddress={instanceAddress}
							index={idx}
							templateAddress={templateAddress}
							onInstanceClick={handleInstanceClick}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-6 text-slate-500 dark:text-slate-400">
					<p className="text-sm">No instances created yet</p>
					<p className="text-xs mt-1">Click "Start" to create the first instance of this process</p>
				</div>
			)}
		</div>
	);
};

const InstanceCard = ({
	instanceAddress,
	index,
	templateAddress,
	onInstanceClick,
}: {
	instanceAddress: string;
	index: number;
	templateAddress: string;
	onInstanceClick: (address: string) => void;
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
	const status = isCompleted ? "Completed" : `Step ${currentStep ? Number(currentStep) + 1 : 0}`;
	const statusColor = isCompleted 
		? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-200" 
		: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200";

	return (
		<button
			onClick={() => onInstanceClick(instanceAddress)}
			className="p-3 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all text-left group"
		>
			<p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Instance #{index + 1}</p>
			<p className="font-mono text-sm text-blue-900 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 break-all mb-2">
				{shortAddress}
			</p>
			<div className="flex items-center justify-between">
				<span className={`badge badge-sm ${statusColor} font-semibold`}>
					{status}
				</span>
				<span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
					→
				</span>
			</div>
		</button>
	);
};
