"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { InstanceCard } from "~~/components/debu/InstanceCard";

const ExecuteContent = () => {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const instanceParam = searchParams.get("instance");

  if (!address) {
    return (
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-4xl text-center">
          <p className="text-lg text-slate-600 dark:text-slate-400">
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
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">Execute Process</span>
          </h1>
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="text-lg">No process instance selected</p>
            <p className="text-sm mt-2">Go to <a href="/browse" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">Browse</a> to select an instance to execute.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Execute Process</span>
          <span className="block text-sm text-slate-500 dark:text-slate-400 mt-2 font-mono">
            {instanceParam.slice(0, 6)}...{instanceParam.slice(-4)}
          </span>
        </h1>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-blue-200 dark:border-blue-900">
          <InstanceCard address={instanceParam} />
        </div>

        <div className="text-center mt-6">
          <a 
            href="/browse" 
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline text-sm"
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
