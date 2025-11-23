"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { StepBuilder, ProcessStep } from "~~/components/debu/StepBuilder";
import { notification } from "~~/utils/scaffold-eth";

const Design: NextPage = () => {
  const [processName, setProcessName] = useState("");
  const [processDescription, setProcessDescription] = useState("");
  const [processCategory, setProcessCategory] = useState("");
  const [steps, setSteps] = useState<ProcessStep[]>([]);

  const { address: connectedAddress } = useAccount();
  const { data: deployerContractData } = useDeployedContractInfo("DeBuDeployer");
  const { writeContractAsync: deployProcess, isPending } = useScaffoldWriteContract({
    contractName: "DeBuDeployer",
  });

  const categories = [
    "Public Administration",
    "Private Administration",
    "Supply Chain",
    "Other"
  ];

  const handleAddStep = (newStep: ProcessStep) => {
    setSteps([...steps, newStep]);
  };

  const handleDeploy = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet first");
      return;
    }

    if (!deployerContractData) {
      notification.error("DeBuDeployer contract not found on this network");
      return;
    }

    try {
      await deployProcess({
        functionName: "deployProcess",
        args: [processName, processDescription, processCategory, steps],
      });
      // Reset form after successful deployment
      setProcessName("");
      setProcessDescription("");
      setProcessCategory("");
      setSteps([]);
      notification.success("Process deployed successfully!");
    } catch (e) {
      console.error("Error deploying process:", e);
      notification.error("Failed to deploy process");
    }
  };

  return (
    <div className="flex flex-col flex-grow px-4 lg:px-8 py-4 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl w-full mx-auto">
        <h1 className="text-center mb-6">
          <span className="block text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 bg-clip-text text-transparent drop-shadow-sm">
            Design Process
          </span>
          <span className="block text-lg mt-1 text-slate-600 dark:text-slate-400">
            Create your Process Blueprint
          </span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:grid-rows-[1fr]">
          {/* Left Column - Process Information */}
          <div className="lg:col-span-4">
            <div className="card bg-white dark:bg-slate-800 shadow-xl shadow-blue-100/50 dark:shadow-blue-900/50 border border-blue-100/50 dark:border-blue-800/50 h-full">
              <div className="card-body p-4">
                <h2 className="card-title text-xl mb-3 text-blue-900 dark:text-blue-300">Process Information</h2>
                
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-sm text-slate-700 dark:text-slate-300">Process Name</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Expense Reimbursement"
                    className="input input-bordered input-sm w-full focus:input-primary focus:shadow-md focus:shadow-blue-200/50 dark:focus:shadow-blue-700/50 bg-white dark:bg-slate-700 dark:text-slate-100"
                    value={processName}
                    onChange={e => setProcessName(e.target.value)}
                  />
                </div>

                <div className="form-control w-full mt-2">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-sm text-slate-700 dark:text-slate-300">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered textarea-sm h-20 focus:textarea-primary focus:shadow-md focus:shadow-blue-200/50 dark:focus:shadow-blue-700/50 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Describe the purpose of this process..."
                    value={processDescription}
                    onChange={e => setProcessDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-control w-full mt-2">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-sm text-slate-700 dark:text-slate-300">Category</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full focus:select-primary focus:shadow-md focus:shadow-blue-200/50 dark:focus:shadow-blue-700/50 bg-white dark:bg-slate-700 dark:text-slate-100"
                    value={processCategory}
                    onChange={e => setProcessCategory(e.target.value)}
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="divider my-3"></div>

                <div className="alert alert-info shadow-lg shadow-blue-200/30 dark:shadow-blue-900/30 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-blue-600 dark:stroke-blue-400 shrink-0 w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div className="text-xs text-blue-900 dark:text-blue-200">
                    <p className="font-semibold">Steps: {steps.length}</p>
                    <p className="opacity-70">Add steps on the right →</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Step Builder */}
          <div className="lg:col-span-8">
            <div className="card bg-white dark:bg-slate-800 shadow-xl shadow-blue-100/50 dark:shadow-blue-900/50 border border-blue-100/50 dark:border-blue-800/50 h-full">
              <div className="card-body p-4">
                <h2 className="card-title text-xl mb-3 text-blue-900 dark:text-blue-300">Process Steps</h2>
                
                {/* Step Visualization */}
                <div className="w-full overflow-x-auto pb-4 mb-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-lg p-3 min-h-[120px] shadow-inner">
                  {steps.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[90px]">
                      <div className="text-center text-slate-400 dark:text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-1 opacity-50 text-blue-300 dark:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="font-semibold text-sm text-slate-600 dark:text-slate-400">No steps added yet</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Add steps below to visualize your process flow</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center min-w-full px-2">
                      {steps.map((step, index) => {
                        const isFirst = index === 0;
                        
                        // Arrow shape logic
                        let clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)";
                        if (isFirst) {
                          clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)";
                        }

                        return (
                          <div
                            key={index}
                            className="relative flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white w-40 h-20 transition-all hover:shadow-lg hover:shadow-blue-400/50 hover:scale-105 shadow-md"
                            style={{
                              clipPath: clipPath,
                              marginLeft: isFirst ? 0 : "-18px",
                            }}
                          >
                            <div className="flex flex-col items-center text-center px-4">
                              <div className="badge badge-xs bg-white/20 border-none mb-0.5">
                                Step {index + 1}
                              </div>
                              <span className="font-bold text-xs line-clamp-2">{step.name}</span>
                              <span className="text-[9px] opacity-90 mt-0.5 uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded-full">
                                {step.actionType}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="divider text-sm font-semibold my-3 text-slate-600 dark:text-slate-400">Add New Step</div>
                
                {/* Step Builder Component */}
                <StepBuilder onAdd={handleAddStep} />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Deploy Button */}
        <div className="flex justify-center mt-6 mb-4">
          <button 
            className="btn btn-primary btn-md shadow-xl shadow-blue-400/30 dark:shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-500/40 dark:hover:shadow-blue-700/40 hover:scale-105 transition-all px-10"
            onClick={handleDeploy}
            disabled={steps.length === 0 || !processName || !processCategory || !connectedAddress || !deployerContractData || isPending}
          >
            {isPending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Deploying...
              </>
            ) : !connectedAddress ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Connect Wallet
              </>
            ) : !deployerContractData ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Contract Not Found
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Deploy Process Blueprint
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Design;
