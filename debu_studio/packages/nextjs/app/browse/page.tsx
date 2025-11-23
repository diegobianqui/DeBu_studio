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
    <div className="flex flex-col flex-grow px-4 lg:px-8 py-4 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl w-full mx-auto">
        <h1 className="text-center mb-6">
          <span className="block text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 bg-clip-text text-transparent drop-shadow-sm">
            Browse Processes
          </span>
          <span className="block text-lg mt-1 text-slate-600 dark:text-slate-400">
            Start a new process instance
          </span>
        </h1>

        <div className="card bg-white dark:bg-slate-800 shadow-xl shadow-blue-100/50 dark:shadow-blue-900/50 border border-blue-100/50 dark:border-blue-800/50">
          <div className="card-body p-4">
            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 pb-4 border-b border-blue-100 dark:border-blue-900">
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text font-semibold text-sm text-slate-700 dark:text-slate-300">Category</span>
                </label>
                <select
                  className="select select-bordered select-sm w-full focus:select-primary focus:shadow-md focus:shadow-blue-200/50 dark:focus:shadow-blue-700/50 bg-white dark:bg-slate-700 dark:text-slate-100"
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
                  <span className="label-text font-semibold text-sm text-slate-700 dark:text-slate-300">Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="input input-bordered input-sm w-full focus:input-primary focus:shadow-md focus:shadow-blue-200/50 dark:focus:shadow-blue-700/50 bg-white dark:bg-slate-700 dark:text-slate-100"
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text font-semibold text-sm text-slate-700 dark:text-slate-300">Address</span>
                </label>
                <input
                  type="text"
                  placeholder="Search by address..."
                  className="input input-bordered input-sm w-full focus:input-primary focus:shadow-md focus:shadow-blue-200/50 dark:focus:shadow-blue-700/50 bg-white dark:bg-slate-700 dark:text-slate-100"
                  value={filterAddress}
                  onChange={e => setFilterAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Table Section */}
            {deployedProcessesCount && Number(deployedProcessesCount) > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <tr>
                      <th className="text-white font-bold w-8"></th>
                      <th className="text-white font-bold">Category</th>
                      <th className="text-white font-bold">Name</th>
                      <th className="text-white font-bold">Description</th>
                      <th className="text-white font-bold text-center">Steps</th>
                      <th className="text-white font-bold">Address</th>
                      <th className="text-white font-bold text-center">Action</th>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">No processes deployed yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">Go to Design section to create your first process blueprint!</p>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
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
