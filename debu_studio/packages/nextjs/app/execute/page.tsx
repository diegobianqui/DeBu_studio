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
          <div className="text-center py-12 text-base-content/60">
            <p className="text-lg">No process instance selected</p>
            <p className="text-sm mt-2">Go to <a href="/browse" className="link link-primary">Browse</a> to select an instance to execute.</p>
          </div>
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
