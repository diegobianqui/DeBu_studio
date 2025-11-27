"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { ProcessTableRow } from "~~/components/debu/ProcessTableRow";
import { InstancesList } from "~~/components/debu/InstancesList";

const Browse: NextPage = () => {
  const [filterCategory, setFilterCategory] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterAddress, setFilterAddress] = useState("");
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set());

  const { data: deployedProcessesCount } = useScaffoldReadContract({
    contractName: "DeBuDeployer",
    functionName: "getDeployedProcessesCount",
  });

  const toggleExpandProcess = (address: string) => {
    const newExpanded = new Set(expandedProcesses);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedProcesses(newExpanded);
  };

  const categories = ["Public Administration", "Private Administration", "Supply Chain", "Other"];

  return (
    <div className="flex flex-col flex-grow px-4 lg:px-8 py-4">
      <div className="max-w-6xl w-full mx-auto">
        <h1 className="text-center mb-6">
          <span className="block text-4xl font-bold text-base-content">
            Browse Processes
          </span>
          <span className="block text-lg mt-2 text-base-content/60">
            Start a new process instance
          </span>
        </h1>

        <div className="card">
          <div className="card-body p-4">
            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 pb-4 border-b border-base-300">
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text font-semibold text-sm">Category</span>
                </label>
                <select
                  className="select select-bordered select-sm w-full focus:select-primary"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text font-semibold text-sm">Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="input input-bordered input-sm w-full focus:input-primary"
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text font-semibold text-sm">Address</span>
                </label>
                <input
                  type="text"
                  placeholder="Search by address..."
                  className="input input-bordered input-sm w-full focus:input-primary"
                  value={filterAddress}
                  onChange={e => setFilterAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Table Section */}
            {deployedProcessesCount && Number(deployedProcessesCount) > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-primary text-primary-content">
                    <tr>
                      <th className="font-bold w-8"></th>
                      <th className="font-bold">Category</th>
                      <th className="font-bold">Name</th>
                      <th className="font-bold">Description</th>
                      <th className="font-bold text-center">Steps</th>
                      <th className="font-bold">Address</th>
                      <th className="font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Number(deployedProcessesCount) }).map((_, idx) => (
                      <ProcessAddressFetcher
                        key={idx}
                        index={idx}
                        filterCategory={filterCategory}
                        filterName={filterName}
                        filterAddress={filterAddress}
                        expandedProcesses={expandedProcesses}
                        onToggleExpand={toggleExpandProcess}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : deployedProcessesCount === 0n ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-base-content/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <p className="text-lg font-semibold text-base-content">No processes deployed yet</p>
                <p className="text-sm text-base-content/60">Go to Design section to create your first process blueprint!</p>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProcessAddressFetcher = ({ 
  index, 
  filterCategory, 
  filterName, 
  filterAddress,
  expandedProcesses,
  onToggleExpand
}: { 
  index: number;
  filterCategory?: string;
  filterName?: string;
  filterAddress?: string;
  expandedProcesses: Set<string>;
  onToggleExpand: (address: string) => void;
}) => {
  const { data: address } = useScaffoldReadContract({
    contractName: "DeBuDeployer",
    functionName: "getDeployedProcess",
    args: [BigInt(index)],
  });

  if (!address) return null;

  return (
    <>
      <ProcessTableRow 
        address={address}
        index={index}
        filterCategory={filterCategory}
        filterName={filterName}
        filterAddress={filterAddress}
        isExpanded={expandedProcesses.has(address)}
        onToggleExpand={onToggleExpand}
      />
      {expandedProcesses.has(address) && (
        <tr className="bg-blue-50/50 dark:bg-slate-700/30">
          <td colSpan={7} className="p-0">
            <InstancesList templateAddress={address} />
          </td>
        </tr>
      )}
    </>
  );
};

export default Browse;
