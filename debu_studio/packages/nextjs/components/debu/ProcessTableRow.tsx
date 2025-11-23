"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";
import { decodeEventLog } from "viem";

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
		name: "instantiate",
		outputs: [{ internalType: "address", name: "instance", type: "address" }],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "instance", type: "address" },
			{ indexed: true, internalType: "address", name: "creator", type: "address" },
		],
		name: "InstanceCreated",
		type: "event",
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
	const [isRedirecting, setIsRedirecting] = useState(false);

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

	const { writeContractAsync, isPending, data: txHash } = useWriteContract();
	const { data: txReceipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
		hash: txHash as `0x${string}`,
	});

	// Watch for successful transaction and extract instance address from logs
	React.useEffect(() => {
		if (txReceipt && isRedirecting) {
			try {
				// Parse the InstanceCreated event from the receipt logs
				const instanceCreatedLog = txReceipt.logs.find((log) => {
					// Check if this log matches our contract's InstanceCreated event
					try {
						const decoded = decodeEventLog({
							abi: PROCESS_TEMPLATE_ABI,
							data: log.data,
							topics: log.topics,
						});
						return decoded.eventName === "InstanceCreated";
					} catch {
						return false;
					}
				});

				if (instanceCreatedLog) {
					try {
						const decoded = decodeEventLog({
							abi: PROCESS_TEMPLATE_ABI,
							data: instanceCreatedLog.data,
							topics: instanceCreatedLog.topics,
						}) as any;
						
						if (decoded.args?.instance) {
							const instanceAddress = decoded.args.instance;
							router.push(`/execute?instance=${instanceAddress}`);
							setIsRedirecting(false);
						}
					} catch (e) {
						console.error("Error decoding event:", e);
						// Fallback: redirect to browse
						router.push("/browse");
						setIsRedirecting(false);
					}
				} else {
					// No event found, fallback to browse
					router.push("/browse");
					setIsRedirecting(false);
				}
			} catch (e) {
				console.error("Error processing transaction receipt:", e);
				router.push("/browse");
				setIsRedirecting(false);
			}
		}
	}, [txReceipt, isRedirecting, router]);

	const handleStart = async () => {
		try {
			setIsRedirecting(true);
			await writeContractAsync({
				address: address as `0x${string}`,
				abi: PROCESS_TEMPLATE_ABI,
				functionName: "instantiate",
			});
			notification.success("Process instance created! Redirecting...");
		} catch (e) {
			console.error("Error starting process:", e);
			notification.error("Failed to start process instance");
			setIsRedirecting(false);
		}
	};

	// Apply filters
	if (filterCategory && category !== filterCategory) return null;
	if (filterName && !String(name || "").toLowerCase().includes(filterName.toLowerCase())) return null;
	if (filterAddress && !address.toLowerCase().includes(filterAddress.toLowerCase())) return null;

	// Show loading state
	if (!name || category === undefined) {
		return (
			<tr className="border-b border-blue-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
				<td colSpan={6} className="p-3 text-center text-slate-500 dark:text-slate-400">
					<span className="loading loading-spinner loading-sm"></span>
				</td>
			</tr>
		);
	}

	const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

	return (
		<tr className="border-b border-blue-100 dark:border-slate-700 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors">
			<td className="p-4 text-center">
				<button
					onClick={() => onToggleExpand?.(address)}
					className="btn btn-ghost btn-xs p-0 h-6 w-6 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900"
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
			<td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400 cursor-help hover:text-blue-600 dark:hover:text-blue-400" title={address}>
				{shortAddress}
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
						"Start New"
					)}
				</button>
			</td>
		</tr>
	);
};
