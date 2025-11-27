"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { hardhat } from "viem/chains";
import { notification } from "~~/utils/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const PROCESS_TEMPLATE_ABI = [
	{
		inputs: [],
		name: "name",
		outputs: [{ internalType: "string", name: "", type: "string" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "description",
		outputs: [{ internalType: "string", name: "", type: "string" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "category",
		outputs: [{ internalType: "string", name: "", type: "string" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "getStepCount",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "instantiationCount",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "instantiate",
		outputs: [{ internalType: "address", name: "instance", type: "address" }],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;

interface ProcessTableRowProps {
	address: string;
	index?: number;
	filterCategory?: string;
	filterName?: string;
	filterAddress?: string;
	isExpanded?: boolean;
	onToggleExpand?: (address: string) => void;
}

export const ProcessTableRow = ({ 
	address, 
	index, 
	filterCategory = "",
	filterName = "",
	filterAddress = "",
	isExpanded = false,
	onToggleExpand,
}: ProcessTableRowProps) => {
	const router = useRouter();
	const { targetNetwork } = useTargetNetwork();

	const { data: name } = useReadContract({
		address: address as `0x${string}`,
		abi: PROCESS_TEMPLATE_ABI,
		functionName: "name",
	});

	const { data: description } = useReadContract({
		address: address as `0x${string}`,
		abi: PROCESS_TEMPLATE_ABI,
		functionName: "description",
	});

	const { data: category } = useReadContract({
		address: address as `0x${string}`,
		abi: PROCESS_TEMPLATE_ABI,
		functionName: "category",
	});

	const { data: stepCount } = useReadContract({
		address: address as `0x${string}`,
		abi: PROCESS_TEMPLATE_ABI,
		functionName: "getStepCount",
	});

	const { data: instantiationCount } = useReadContract({
		address: address as `0x${string}`,
		abi: PROCESS_TEMPLATE_ABI,
		functionName: "instantiationCount",
	});

	const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
	const { writeContractAsync, isPending } = useWriteContract();
	
	const { data: receipt } = useWaitForTransactionReceipt({
		hash: txHash || undefined,
	});

	const handleStart = async () => {
		try {
			const hash = await writeContractAsync({
				address: address as `0x${string}`,
				abi: PROCESS_TEMPLATE_ABI,
				functionName: "instantiate",
			});
			setTxHash(hash);
			notification.success("Process instance created! Redirecting...");
		} catch (e) {
			console.error("Error starting process:", e);
			notification.error("Failed to start process instance");
		}
	};

	// When transaction completes, extract instance address from logs
	React.useEffect(() => {
		if (receipt && receipt.logs && receipt.logs.length > 0) {
			// The InstanceCreated event is emitted with the instance address
			// Event signature: event InstanceCreated(address indexed instance, address indexed creator);
			// We can extract it from the logs
			try {
				// The first log should be the InstanceCreated event
				// The second topic (index 1) contains the instance address (32 bytes, padded)
				if (receipt.logs[0] && receipt.logs[0].topics && receipt.logs[0].topics[1]) {
					const instanceAddress = `0x${receipt.logs[0].topics[1].slice(-40)}`;
					console.log("Created instance:", instanceAddress);
					setTimeout(() => {
						router.push(`/execute?instance=${instanceAddress}`);
					}, 500);
				}
			} catch (error) {
				console.error("Error parsing instance address from receipt:", error);
				// Fallback: just redirect to execute without instance
				router.push("/execute");
			}
		}
	}, [receipt, router]);

	// Apply filters
	if (filterCategory && category !== filterCategory) return null;
	if (filterName && !String(name || "").toLowerCase().includes(filterName.toLowerCase())) return null;
	if (filterAddress && !address.toLowerCase().includes(filterAddress.toLowerCase())) return null;

	// Show loading state
	if (!name || category === undefined) {
		return (
			<tr className="border-b border-blue-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
				<td colSpan={8} className="p-3 text-center text-slate-500 dark:text-slate-400">
					<span className="loading loading-spinner loading-sm"></span>
				</td>
			</tr>
		);
	}

	const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

	return (
		<tr className="border-b border-blue-100 dark:border-slate-700 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors">
			<td className="p-4 text-center">
				{onToggleExpand && (
					<button
						onClick={() => onToggleExpand(address)}
						className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-blue-200 dark:hover:bg-slate-600 transition-colors"
						title={isExpanded ? "Hide instances" : "Show instances"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className={`h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
						</svg>
					</button>
				)}
			</td>
			<td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
				<span className="badge badge-sm bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200 font-semibold">
					{(category as string) || "Uncategorized"}
				</span>
			</td>
			<td className="p-4 text-slate-900 dark:text-slate-100 font-semibold">
				{(name as string) || "Loading..."}
			</td>
			<td className="p-4 text-slate-600 dark:text-slate-400 text-sm max-w-xs truncate">
				{(description as string) || "—"}
			</td>
			<td className="p-4 text-center">
				<span className="badge badge-sm bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-200 font-semibold">
					{stepCount ? Number(stepCount) : 0} steps
				</span>
			</td>
			<td className="p-4 text-center">
				<span className="badge badge-sm bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-200 font-semibold">
					{instantiationCount ? Number(instantiationCount) : 0} uses
				</span>
			</td>
			<td className="p-4 font-mono text-xs">
				<a 
					href={targetNetwork.id === hardhat.id ? `http://localhost:3000/blockexplorer/address/${address}` : `https://etherscan.io/address/${address}`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-slate-600 dark:text-slate-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
					title={address}
				>
					{shortAddress}
				</a>
			</td>
			<td className="p-4 text-center">
				<button
					className="btn btn-primary btn-sm shadow-md hover:shadow-lg hover:shadow-blue-300/30 dark:hover:shadow-blue-700/30 focus:shadow-md focus:shadow-blue-200/50 dark:focus:shadow-blue-700/50"
					onClick={handleStart}
					disabled={isPending}
				>
					{isPending ? (
						<>
							<span className="loading loading-spinner loading-xs"></span>
							Starting...
						</>
					) : (
						"Start"
					)}
				</button>
			</td>
		</tr>
	);
};
