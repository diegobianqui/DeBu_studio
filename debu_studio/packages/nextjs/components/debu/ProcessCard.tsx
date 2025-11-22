"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWriteContract } from "wagmi";

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
] as const;

export const ProcessCard = ({ address }: { address: string }) => {
	const { data: name } = useReadContract({
		address: address,
		abi: PROCESS_TEMPLATE_ABI,
		functionName: "name",
	});

	const { data: description } = useReadContract({
		address: address,
		abi: PROCESS_TEMPLATE_ABI,
		functionName: "description",
	});

	const { data: stepCount } = useReadContract({
		address: address,
		abi: PROCESS_TEMPLATE_ABI,
		functionName: "getStepCount",
	});

	const { writeContractAsync, isPending } = useWriteContract();

	const handleStart = async () => {
		try {
			await writeContractAsync({
				address: address,
				abi: PROCESS_TEMPLATE_ABI,
				functionName: "instantiate",
			});
			alert("Process started! Check 'My Processes' (coming soon)");
		} catch (e) {
			console.error("Error starting process:", e);
		}
	};

	return (
		<div className="card w-96 bg-base-100 shadow-xl">
			<div className="card-body">
				<h2 className="card-title">{name as string || "Loading..."}</h2>
				<p>{description as string || "..."}</p>
				<div className="badge badge-secondary">
					{Number(stepCount || 0)} Steps
				</div>
				<div className="card-actions justify-end mt-4">
					<button
						className="btn btn-primary"
						onClick={handleStart}
						disabled={isPending}
					>
						{isPending ? "Starting..." : "Start Process"}
					</button>
				</div>
			</div>
		</div>
	);
};
